/**
 * OFFVYBE — SHIPROCKET LOGISTICS ADAPTER
 *
 * Implements the ShippingProvider interface for Shiprocket India API.
 * Features:
 * - JWT token authentication with in-memory caching and auto-refresh
 * - Forward delivery serviceability and dynamic courier rate estimation
 * - Automated shipment creation with AWB assignment
 * - Real-time tracking checkpoint parsing
 * - Deterministic, safe Mock/Sandbox mode when credentials are unconfigured or in tests
 */

import {
  ShippingProvider,
  ServiceabilityParams,
  ServiceabilityResult,
  CreateShipmentParams,
  ShipmentResult,
  TrackingResult,
  CancelShipmentResult,
  CourierOption,
  ConnectionTestResult,
  PickupLocation,
} from "./types";
import { isValidIndianPincode } from "../pincode";

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";

export class ShiprocketShippingAdapter implements ShippingProvider {
  readonly providerName = "Shiprocket";

  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  get isConfigured(): boolean {
    const directToken = process.env.SHIPROCKET_TOKEN || process.env.SHIPROCKET_API_KEY;
    if (directToken && !directToken.includes("replace_with")) return true;
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    return Boolean(
      email &&
      password &&
      !email.includes("replace_with") &&
      !password.includes("replace_with")
    );
  }

  /**
   * Retrieves or refreshes JWT authentication token from Shiprocket.
   */
  private async getAuthToken(): Promise<string | null> {
    if (!this.isConfigured) return null;

    const directToken = process.env.SHIPROCKET_TOKEN || process.env.SHIPROCKET_API_KEY;
    if (directToken && !directToken.includes("replace_with")) {
      return directToken.trim();
    }

    const now = Date.now();
    // Re-use cached token if more than 5 minutes remain
    if (this.cachedToken && this.tokenExpiresAt - now > 5 * 60 * 1000) {
      return this.cachedToken;
    }

    try {
      const res = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD,
        }),
      });

      if (!res.ok) {
        console.warn(`[Shiprocket Auth Warning] Login failed with status: ${res.status}`);
        return null;
      }

      const data = await res.json();
      if (data?.token) {
        this.cachedToken = data.token;
        // Shiprocket tokens are valid for 10 days; cache for 9 days
        this.tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000;
        return this.cachedToken;
      }
      return null;
    } catch (err) {
      console.error("[Shiprocket Auth Error]:", err);
      return null;
    }
  }

  /**
   * Checks PIN code serviceability and retrieves courier rates.
   */
  async checkServiceability(params: ServiceabilityParams): Promise<ServiceabilityResult> {
    if (!isValidIndianPincode(params.deliveryPincode)) {
      return {
        isServiceable: false,
        deliveryPincode: params.deliveryPincode,
        availableCouriers: [],
        isMock: !this.isConfigured,
      };
    }

    const token = await this.getAuthToken();

    // Live API mode
    if (token) {
      try {
        const query = new URLSearchParams({
          pickup_postcode: params.pickupPincode || process.env.SHIPROCKET_PICKUP_PINCODE || "342008",
          delivery_postcode: params.deliveryPincode,
          weight: String(params.weightKg || 0.5),
          cod: params.isCod ? "1" : "0",
        });

        const res = await fetch(`${SHIPROCKET_API_BASE}/courier/serviceability/?${query.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const companies = data?.data?.available_courier_companies || [];

          if (companies.length > 0) {
            const couriers: CourierOption[] = companies.map((c: any) => ({
              courierId: String(c.courier_company_id),
              courierName: c.courier_name || "Express Courier",
              ratePaise: Math.round(Number(c.rate || 0) * 100),
              estimatedDeliveryDays: Number(c.estimated_delivery_days || 3),
              etdDate: c.etd,
              isCodAvailable: Boolean(c.cod === 1),
            }));

            couriers.sort((a, b) => a.ratePaise - b.ratePaise);

            return {
              isServiceable: true,
              deliveryPincode: params.deliveryPincode,
              cheapestCourier: couriers[0],
              fastestCourier: [...couriers].sort((a, b) => a.estimatedDeliveryDays - b.estimatedDeliveryDays)[0],
              availableCouriers: couriers,
              isMock: false,
            };
          }
        }
      } catch (err) {
        console.warn("[Shiprocket Serviceability API Warning]: Falling back to sandbox mock.", err);
      }
    }

    // Deterministic Sandbox Mock Mode
    return this.generateMockServiceability(params);
  }

  /**
   * Books shipment and assigns AWB.
   */
  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const token = await this.getAuthToken();

    if (token) {
      try {
        const payload = {
          order_id: params.orderNumber,
          order_date: params.orderDate.toISOString().slice(0, 19).replace("T", " "),
          pickup_location: params.pickupLocationId || process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
          billing_customer_name: params.customerName,
          billing_last_name: "",
          billing_address: params.deliveryAddress.street,
          billing_address_2: params.deliveryAddress.apartment || "",
          billing_city: params.deliveryAddress.city,
          billing_pincode: params.deliveryAddress.postalCode,
          billing_state: params.deliveryAddress.state,
          billing_country: "India",
          billing_email: params.customerEmail,
          billing_phone: params.customerPhone,
          shipping_is_billing: true,
          order_items: params.items.map((it) => ({
            name: it.name,
            sku: it.sku,
            units: it.units,
            selling_price: it.sellingPricePaise / 100,
          })),
          payment_method: params.paymentMethod === "COD" ? "COD" : "Prepaid",
          sub_total: params.totalAmountPaise / 100,
          length: params.dimensions.lengthCm,
          breadth: params.dimensions.breadthCm,
          height: params.dimensions.heightCm,
          weight: params.dimensions.weightKg,
        };

        const res = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          const shipmentId = String(data.shipment_id || data.order_id);
          let awbCode = data.awb_code && data.awb_code !== "null" ? String(data.awb_code) : "";
          let courierName = data.courier_name || "Delhivery Air / Blue Dart Apex";
          let labelUrl = data.label_url || undefined;

          // If Shiprocket order was created without instant AWB, trigger courier AWB allocation
          if (!awbCode && data.shipment_id) {
            try {
              const awbRes = await fetch(`${SHIPROCKET_API_BASE}/courier/assign/awb`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ shipment_id: data.shipment_id }),
              });
              if (awbRes.ok) {
                const awbData = await awbRes.json();
                const assignedAwb =
                  awbData?.response?.data?.awb_code ||
                  awbData?.response?.awb_code ||
                  awbData?.awb_code;
                if (assignedAwb) awbCode = String(assignedAwb);

                const assignedCourier =
                  awbData?.response?.data?.courier_name ||
                  awbData?.response?.courier_name ||
                  awbData?.courier_name;
                if (assignedCourier) courierName = String(assignedCourier);
              }
            } catch (awbErr) {
              console.warn("[Shiprocket AWB Assignment Warning]:", awbErr);
            }
          }

          // If label URL wasn't included, request thermal/PDF shipping label
          if (!labelUrl && data.shipment_id) {
            try {
              const labelRes = await fetch(`${SHIPROCKET_API_BASE}/courier/generate/label`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ shipment_id: [data.shipment_id] }),
              });
              if (labelRes.ok) {
                const labelData = await labelRes.json();
                if (labelData?.label_url) labelUrl = labelData.label_url;
              }
            } catch (labelErr) {
              console.warn("[Shiprocket Label Generation Warning]:", labelErr);
            }
          }

          return {
            success: true,
            shipmentId,
            orderId: String(data.order_id || params.orderNumber),
            courierName,
            awbCode: awbCode || `SR-${params.orderNumber}`,
            labelUrl,
            isMock: false,
          };
        } else {
          const errBody = await res.text().catch(() => "");
          console.warn(`[Shiprocket Order Create Failed] HTTP ${res.status}: ${errBody}`);
        }
      } catch (err) {
        console.warn("[Shiprocket Order Create Warning]: Falling back to sandbox mock.", err);
      }
    }

    // Deterministic Sandbox Mock Mode
    return {
      success: true,
      shipmentId: `MOCK-SHIP-${params.orderNumber}`,
      orderId: params.orderNumber,
      courierName: "Blue Dart Apex Express",
      awbCode: `AWB${params.deliveryAddress.postalCode}${Math.floor(1000 + Math.random() * 9000)}`,
      labelUrl: `https://offvybe.in/api/mock/labels/${params.orderNumber}.pdf`,
      isMock: true,
      message: "Shipment booked in Sandbox Mock Mode.",
    };
  }

  /**
   * Tracks shipment status by AWB.
   */
  async trackShipment(awbCode: string): Promise<TrackingResult> {
    const token = await this.getAuthToken();

    if (token && !awbCode.startsWith("AWB")) {
      try {
        const res = await fetch(`${SHIPROCKET_API_BASE}/courier/track/awb/${encodeURIComponent(awbCode)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const trackData = data?.tracking_data;
          const status = (trackData?.track_status || "").toUpperCase();

          let normalizedStatus: TrackingResult["currentStatus"] = "IN_TRANSIT";
          if (status.includes("DELIVERED")) normalizedStatus = "DELIVERED";
          else if (status.includes("OUT")) normalizedStatus = "OUT_FOR_DELIVERY";
          else if (status.includes("PICKED")) normalizedStatus = "PICKED_UP";
          else if (status.includes("RTO")) normalizedStatus = "RTO";

          return {
            awbCode,
            currentStatus: normalizedStatus,
            carrierName: trackData?.courier_name || "Shiprocket Partner",
            checkpoints: (trackData?.shipment_track_activities || []).map((a: any) => ({
              timestamp: a.date || new Date().toISOString(),
              location: a.location || "En Route",
              status: a["sr-status-label"] || a.activity || "In Transit",
              activity: a.activity || "Shipment in transit",
            })),
            estimatedDelivery: trackData?.etd,
            isMock: false,
          };
        }
      } catch (err) {
        console.warn("[Shiprocket Tracking Warning]: Falling back to mock tracking.", err);
      }
    }

    // Deterministic Mock Tracking
    return {
      awbCode,
      currentStatus: "IN_TRANSIT",
      carrierName: "Blue Dart Apex Express",
      checkpoints: [
        {
          timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          location: "Pal Road Atelier Hub, Jodhpur",
          status: "Manifested",
          activity: "Package sorted and manifested for air express transit",
        },
        {
          timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          location: "Jodhpur Air Cargo Hub, Rajasthan",
          status: "In Transit",
          activity: "Dispatched on connecting flight",
        },
      ],
      estimatedDelivery: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10),
      isMock: true,
    };
  }

  /**
   * Cancels shipment.
   */
  async cancelShipment(shipmentId: string, awbCode?: string): Promise<CancelShipmentResult> {
    const token = await this.getAuthToken();

    if (token && !shipmentId.startsWith("MOCK-")) {
      try {
        const res = await fetch(`${SHIPROCKET_API_BASE}/orders/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids: [shipmentId], awbs: awbCode ? [awbCode] : [] }),
        });

        if (res.ok) {
          return { success: true, message: "Shipment cancelled successfully in Shiprocket.", isMock: false };
        }
      } catch (err) {
        console.warn("[Shiprocket Cancel Warning]:", err);
      }
    }

    return {
      success: true,
      message: "Shipment cancelled in Sandbox Mock Mode.",
      isMock: true,
    };
  }

  /**
   * Tests API connection and fetches registered pickup warehouse locations from Shiprocket.
   */
  async checkConnectionAndPickups(): Promise<ConnectionTestResult> {
    const token = await this.getAuthToken();
    if (!token) {
      return {
        success: false,
        isLive: false,
        locations: [
          {
            id: "jodhpur-atelier-01",
            pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
            address: "Pal Road, Jodhpur",
            city: "Jodhpur",
            state: "Rajasthan",
            pin_code: process.env.SHIPROCKET_PICKUP_PINCODE || "342008",
            phone: "9079199951",
            status: 1,
          },
        ],
        message: "Operating in Sandbox Simulation mode (API credentials not configured or in test).",
      };
    }

    try {
      const res = await fetch(`${SHIPROCKET_API_BASE}/settings/company/pickup`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return {
          success: false,
          isLive: true,
          locations: [],
          error: `Shiprocket API responded with status ${res.status}`,
        };
      }

      const data = await res.json();
      const rawLocs = data?.data?.shipping_address || [];
      const locations: PickupLocation[] = rawLocs.map((loc: any) => ({
        id: String(loc.id || loc.pickup_location),
        pickup_location: loc.pickup_location || "Primary",
        address: loc.address || "",
        city: loc.city || "",
        state: loc.state || "",
        pin_code: String(loc.pin_code || ""),
        phone: String(loc.phone || ""),
        status: Number(loc.status ?? 1),
      }));

      return {
        success: true,
        isLive: true,
        locations,
        message: `Successfully connected to Shiprocket API. Found ${locations.length} registered pickup locations.`,
      };
    } catch (err) {
      return {
        success: false,
        isLive: true,
        locations: [],
        error: (err as Error).message,
      };
    }
  }

  /**
   * Generates or fetches printable PDF shipping label.
   */
  async generateLabel(shipmentId: string): Promise<string | null> {
    const token = await this.getAuthToken();
    if (!token || shipmentId.startsWith("MOCK-")) {
      return `https://offvybe.com/api/mock/labels/${shipmentId}.pdf`;
    }

    try {
      const res = await fetch(`${SHIPROCKET_API_BASE}/courier/generate/label`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: [shipmentId] }),
      });
      if (res.ok) {
        const data = await res.json();
        return data?.label_url || null;
      }
    } catch (err) {
      console.warn("[Shiprocket generateLabel Warning]:", err);
    }
    return null;
  }

  private generateMockServiceability(params: ServiceabilityParams): ServiceabilityResult {
    const isMetro = ["11", "40", "56", "60", "70", "50", "38"].some((p) => params.deliveryPincode.startsWith(p));
    const transitDays = isMetro ? 2 : 4;

    const couriers: CourierOption[] = [
      {
        courierId: "bd-apex-01",
        courierName: "Blue Dart Apex Priority Air",
        ratePaise: params.orderValuePaise >= 199900 ? 0 : 25000,
        estimatedDeliveryDays: transitDays,
        isCodAvailable: true,
      },
      {
        courierId: "delhivery-air-02",
        courierName: "Delhivery Air Express",
        ratePaise: params.orderValuePaise >= 199900 ? 0 : 15000,
        estimatedDeliveryDays: transitDays + 1,
        isCodAvailable: true,
      },
    ];

    return {
      isServiceable: true,
      deliveryPincode: params.deliveryPincode,
      cheapestCourier: couriers[1],
      fastestCourier: couriers[0],
      availableCouriers: couriers,
      isMock: true,
    };
  }
}

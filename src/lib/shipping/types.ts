/**
 * TREND STREET — CARRIER-AGNOSTIC SHIPPING & LOGISTICS ADAPTER INTERFACES
 *
 * Designed to provide a unified logistics interface across domestic carriers in India
 * (Shiprocket, Delhivery, Blue Dart Apex) with full support for serviceability checks,
 * rate estimation, shipment booking, AWB generation, and tracking.
 */

export interface ShippingDimensions {
  lengthCm: number; // in centimeters
  breadthCm: number;
  heightCm: number;
  weightKg: number;  // in kilograms (computed from garment GSM)
}

export interface ShippingItem {
  name: string;
  sku: string;
  units: number;
  sellingPricePaise: number;
  discountPaise?: number;
  taxPaise?: number;
}

export interface ServiceabilityParams {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  isCod: boolean;
  orderValuePaise: number;
}

export interface CourierOption {
  courierId: string;
  courierName: string;
  ratePaise: number;
  estimatedDeliveryDays: number;
  etdDate?: string;
  isCodAvailable: boolean;
}

export interface ServiceabilityResult {
  isServiceable: boolean;
  deliveryPincode: string;
  cheapestCourier?: CourierOption;
  fastestCourier?: CourierOption;
  availableCouriers: CourierOption[];
  isMock: boolean;
}

export interface CreateShipmentParams {
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  pickupLocationId?: string; // configured pickup warehouse in provider
  items: ShippingItem[];
  dimensions: ShippingDimensions;
  paymentMethod: "PREPAID" | "COD";
  totalAmountPaise: number;
}

export interface ShipmentResult {
  success: boolean;
  shipmentId: string;
  orderId: string;
  courierName: string;
  awbCode: string;
  labelUrl?: string;
  manifestUrl?: string;
  routingCode?: string;
  isMock: boolean;
  message?: string;
}

export interface TrackingCheckpoint {
  timestamp: string;
  location: string;
  status: string;
  activity: string;
}

export interface TrackingResult {
  awbCode: string;
  currentStatus: "PLACED" | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "RTO" | "CANCELLED";
  carrierName: string;
  checkpoints: TrackingCheckpoint[];
  estimatedDelivery?: string;
  isMock: boolean;
}

export interface CancelShipmentResult {
  success: boolean;
  message: string;
  isMock: boolean;
}

/**
 * Universal Shipping Provider Interface
 */
export interface ShippingProvider {
  readonly providerName: string;
  readonly isConfigured: boolean;

  /** Checks delivery PIN code serviceability and retrieves available courier rates */
  checkServiceability(params: ServiceabilityParams): Promise<ServiceabilityResult>;

  /** Creates and books an official shipment with the logistics provider */
  createShipment(params: CreateShipmentParams): Promise<ShipmentResult>;

  /** Tracks real-time shipment status by AWB number */
  trackShipment(awbCode: string): Promise<TrackingResult>;

  /** Cancels a booked shipment before courier pickup */
  cancelShipment(shipmentId: string, awbCode?: string): Promise<CancelShipmentResult>;
}

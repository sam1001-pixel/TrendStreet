/**
 * TREND STREET — SHIPPING PROVIDER FACTORY
 */

import { ShippingProvider } from "./types";
import { ShiprocketShippingAdapter } from "./shiprocket";

export * from "./types";
export * from "./shiprocket";

let defaultProvider: ShippingProvider | null = null;

/**
 * Returns the active configured logistics provider (defaults to Shiprocket).
 */
export function getShippingProvider(): ShippingProvider {
  if (!defaultProvider) {
    defaultProvider = new ShiprocketShippingAdapter();
  }
  return defaultProvider;
}

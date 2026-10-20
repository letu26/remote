import { http } from "@/services/http";
import type { ShippingMethod } from "@/types/order";

export const shippingService = {
  list: () => http.get<ShippingMethod[]>("/shipping-methods").then((r) => r.data),
};

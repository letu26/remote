import { createCrudService } from "./admin-catalog.service";
import type { AdminShippingMethod, ShippingMethodInput } from "@/types/admin-order";

export const adminShippingService = createCrudService<AdminShippingMethod, ShippingMethodInput>("shipping-methods");

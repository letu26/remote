import { http } from "@/services/http";
import type { Province, Ward } from "@/types/shop";

export const locationService = {
  provinces: () => http.get<Province[]>("/locations/provinces").then((r) => r.data),
  wards: (provinceId: number, signal?: AbortSignal) =>
    http.get<Ward[]>(`/locations/provinces/${provinceId}/wards`, { signal }).then((r) => r.data),
};

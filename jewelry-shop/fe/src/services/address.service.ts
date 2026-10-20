import { http } from "@/services/http";
import type { Address, AddressInput } from "@/types/shop";

export const addressService = {
  list: () => http.get<Address[]>("/users/me/addresses").then((r) => r.data),
  create: (input: AddressInput) => http.post<Address>("/users/me/addresses", input).then((r) => r.data),
  update: (id: number, input: Partial<AddressInput>) =>
    http.patch<Address>(`/users/me/addresses/${id}`, input).then((r) => r.data),
  setDefault: (id: number) => http.put<Address>(`/users/me/addresses/${id}/default`).then((r) => r.data),
  remove: (id: number) => http.delete(`/users/me/addresses/${id}`).then(() => undefined),
};

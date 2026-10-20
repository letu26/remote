import { http } from "./http";
import type { BankTransferSettings } from "@/types/admin-order";

export const adminSettingsService = {
  async getBankTransfer(): Promise<BankTransferSettings> {
    return (await http.get<BankTransferSettings>("/admin/settings/bank-transfer")).data;
  },
  async saveBankTransfer(input: BankTransferSettings): Promise<BankTransferSettings> {
    return (await http.put<BankTransferSettings>("/admin/settings/bank-transfer", input)).data;
  },
};

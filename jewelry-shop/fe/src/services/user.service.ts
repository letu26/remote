import { http } from "./http";

export interface Profile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: "admin" | "user";
  status: string;
  createdAt: string;
}

export const userService = {
  async getMe() {
    const { data } = await http.get<Profile>("/users/me");
    return data;
  },
  async updateMe(input: { fullName?: string; email?: string; phone?: string }) {
    const { data } = await http.patch<Profile>("/users/me", input);
    return data;
  },
  async changePassword(input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    const { data } = await http.patch<{ message: string }>("/users/me/password", input);
    return data;
  },
};

export const adminService = {
  async ping() {
    const { data } = await http.get<{ message: string; admin: { id: number; email: string } }>(
      "/admin/ping",
    );
    return data;
  },
};

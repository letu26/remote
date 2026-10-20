import type { Role } from "@/constants";
import { http } from "./http";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status?: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export const authService = {
  async login(phone: string, password: string) {
    const { data } = await http.post<{ accessToken: string; user: AuthUser }>(
      "/auth/login",
      { phone, password },
    );
    return data;
  },
  async register(input: RegisterInput) {
    const { data } = await http.post<{ user: AuthUser }>("/auth/register", input);
    return data;
  },
  async logout() {
    const { data } = await http.post<{ message: string }>("/auth/logout");
    return data;
  },
  async forgotPassword(email: string) {
    const { data } = await http.post<{
      message: string;
      expiresInSeconds: number;
      resendAfterSeconds: number;
    }>("/auth/forgot-password", { email });
    return data;
  },
  async verifyOtp(email: string, otp: string) {
    const { data } = await http.post<{ resetToken: string; expiresInSeconds: number }>(
      "/auth/verify-otp",
      { email, otp },
    );
    return data;
  },
  async resetPassword(resetToken: string, newPassword: string, confirmPassword: string) {
    const { data } = await http.post<{ message: string }>("/auth/reset-password", {
      resetToken,
      newPassword,
      confirmPassword,
    });
    return data;
  },
};

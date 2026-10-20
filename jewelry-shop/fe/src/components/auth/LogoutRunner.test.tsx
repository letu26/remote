import { cleanup, render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
const logout = vi.fn();
vi.mock("@/services/auth.service", () => ({ authService: { logout: () => logout() } }));

import { LogoutRunner } from "./LogoutRunner";

beforeEach(() => {
  sessionStorage.setItem("accessToken", "tok");
  logout.mockReset();
  replace.mockClear();
});
afterEach(cleanup);

describe("/logout", () => {
  it("gọi API, xóa token, chuyển /login", async () => {
    logout.mockResolvedValue({});
    render(<LogoutRunner />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(sessionStorage.getItem("accessToken")).toBeNull();
  });
  it("API lỗi (401) vẫn xóa token và chuyển", async () => {
    logout.mockRejectedValue({ status: 401, code: "TOKEN_REVOKED" });
    render(<LogoutRunner />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(sessionStorage.getItem("accessToken")).toBeNull();
  });
  it("lỗi mạng vẫn xóa token", async () => {
    logout.mockRejectedValue(new Error("network"));
    render(<LogoutRunner />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(sessionStorage.getItem("accessToken")).toBeNull();
  });
  it("strict mode chỉ gọi API một lần", async () => {
    logout.mockResolvedValue({});
    render(
      <StrictMode>
        <LogoutRunner />
      </StrictMode>,
    );
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(logout).toHaveBeenCalledTimes(1);
  });
  it("không có token thì không gọi API", async () => {
    sessionStorage.clear();
    render(<LogoutRunner />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(logout).not.toHaveBeenCalled();
  });
});

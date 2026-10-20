import { describe, expect, it } from "vitest";
import { decodeJwt, getValidPayload, isTokenExpired } from "./jwt";

function b64url(obj: object) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}
function makeToken(payload: object) {
  return `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.sig`;
}

const now = 1_800_000_000;
const valid = { sub: 7, id: 7, email: "a@b.com", role: "admin", iat: now, exp: now + 86400 };

describe("decodeJwt", () => {
  it("giải mã payload hợp lệ", () => {
    expect(decodeJwt(makeToken(valid))).toMatchObject({ id: 7, email: "a@b.com", role: "admin" });
  });
  it("hỗ trợ ký tự Unicode trong payload", () => {
    const t = makeToken({ ...valid, email: "tên@b.com" });
    expect(decodeJwt(t)?.email).toBe("tên@b.com");
  });
  it("trả null với token sai định dạng", () => {
    expect(decodeJwt("abc")).toBeNull();
    expect(decodeJwt("a.!!!.c")).toBeNull();
    expect(decodeJwt("")).toBeNull();
    expect(decodeJwt(null)).toBeNull();
  });
  it("trả null khi thiếu trường hoặc role lạ", () => {
    expect(decodeJwt(makeToken({ ...valid, role: "hacker" }))).toBeNull();
    expect(decodeJwt(makeToken({ id: 1, role: "user", exp: 1 }))).toBeNull();
  });
});

describe("isTokenExpired / getValidPayload", () => {
  it("phát hiện hết hạn", () => {
    expect(isTokenExpired({ exp: now }, (now + 1) * 1000)).toBe(true);
    expect(isTokenExpired({ exp: now }, now * 1000)).toBe(true);
    expect(isTokenExpired({ exp: now }, (now - 1) * 1000)).toBe(false);
  });
  it("getValidPayload trả null khi hết hạn", () => {
    const t = makeToken(valid);
    expect(getValidPayload(t, (now + 10) * 1000)?.role).toBe("admin");
    expect(getValidPayload(t, (now + 86401) * 1000)).toBeNull();
  });
});

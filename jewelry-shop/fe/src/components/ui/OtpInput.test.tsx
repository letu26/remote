import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { OtpInput } from "./OtpInput";

const current = () => screen.getByTestId("val").textContent;
function Harness() {
  const [v, setV] = useState("");
  return (
    <>
      <OtpInput value={v} onChange={setV} />
      <output data-testid="val">{v}</output>
    </>
  );
}
const digit = (i: number) => screen.getByLabelText(`Chữ số thứ ${i}`) as HTMLInputElement;
const paste = (el: HTMLElement, text: string) =>
  fireEvent.paste(el, { clipboardData: { getData: () => text } });

afterEach(cleanup);

describe("OtpInput", () => {
  it("tự focus ô đầu tiên", () => {
    render(<Harness />);
    expect(digit(1)).toHaveFocus();
  });
  it("chỉ nhận số, bỏ ký tự khác", () => {
    render(<Harness />);
    fireEvent.change(digit(1), { target: { value: "a" } });
    expect(current()).toBe("");
    fireEvent.change(digit(1), { target: { value: "7" } });
    expect(current()).toBe("7");
    expect(digit(2)).toHaveFocus();
  });
  it("dán 6 số điền đủ các ô", () => {
    render(<Harness />);
    paste(digit(1), "123456");
    expect(current()).toBe("123456");
    expect([1, 2, 3, 4, 5, 6].map((i) => digit(i).value).join("")).toBe("123456");
  });
  it("dán chuỗi lẫn ký tự: chỉ lấy số, tối đa 6", () => {
    render(<Harness />);
    paste(digit(1), "12 34-56 789");
    expect(current()).toBe("123456");
  });
  it("Backspace xóa ô hiện tại, ô trống thì lùi ô", () => {
    render(<Harness />);
    paste(digit(1), "123");
    fireEvent.keyDown(digit(3), { key: "Backspace" });
    expect(current()).toBe("12");
    fireEvent.keyDown(digit(3), { key: "Backspace" });
    expect(current()).toBe("1");
    expect(digit(2)).toHaveFocus();
  });
});

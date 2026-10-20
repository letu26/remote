import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { StarPicker } from "./StarPicker";

function Harness({ start = 0 }: { start?: number }) {
  const [v, setV] = useState(start);
  return (
    <>
      <StarPicker value={v} onChange={setV} />
      <output data-testid="value">{v}</output>
    </>
  );
}
afterEach(cleanup);

describe("StarPicker", () => {
  it("là radiogroup với 5 radio có nhãn 'N sao'", () => {
    render(<Harness />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-label"))).toEqual([
      "1 sao", "2 sao", "3 sao", "4 sao", "5 sao",
    ]);
  });
  it("chuột chọn đúng giá trị và đặt aria-checked", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("radio", { name: "3 sao" }));
    expect(screen.getByTestId("value")).toHaveTextContent("3");
    expect(screen.getByRole("radio", { name: "3 sao" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "2 sao" })).toHaveAttribute("aria-checked", "false");
  });
  it("bàn phím: mũi tên, Home, End; không vượt 1..5", () => {
    render(<Harness start={3} />);
    const star = () => screen.getByRole("radio", { name: "3 sao" });
    fireEvent.keyDown(star(), { key: "ArrowRight" });
    expect(screen.getByTestId("value")).toHaveTextContent("4");
    fireEvent.keyDown(screen.getByRole("radio", { name: "4 sao" }), { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("radio", { name: "5 sao" }), { key: "ArrowRight" });
    expect(screen.getByTestId("value")).toHaveTextContent("5");
    fireEvent.keyDown(screen.getByRole("radio", { name: "5 sao" }), { key: "Home" });
    expect(screen.getByTestId("value")).toHaveTextContent("1");
    fireEvent.keyDown(screen.getByRole("radio", { name: "1 sao" }), { key: "ArrowLeft" });
    expect(screen.getByTestId("value")).toHaveTextContent("1");
    fireEvent.keyDown(screen.getByRole("radio", { name: "1 sao" }), { key: "End" });
    expect(screen.getByTestId("value")).toHaveTextContent("5");
  });
  it("chỉ sao đang chọn nằm trong thứ tự Tab (roving tabindex)", () => {
    render(<Harness start={2} />);
    const tab = screen.getAllByRole("radio").map((r) => r.tabIndex);
    expect(tab).toEqual([-1, 0, -1, -1, -1]);
  });
});

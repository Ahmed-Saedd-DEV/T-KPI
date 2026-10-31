import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SmartDatePicker } from "../../src/components/SmartDatePicker";

describe("SmartDatePicker", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders available dates and selects one", () => {
    const onChange = vi.fn();
    render(
      <SmartDatePicker
        availableDates={["2025-04-01", "2025-04-15", "2025-04-30"]}
        selectedDate="2025-04-15"
        onChange={onChange}
        ariaLabel="Picker date"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /picker date/i }));
    expect(
      screen.getByRole("button", { name: /april 1, 2025/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /april 1, 2025/i }));
    expect(onChange).toHaveBeenCalledWith("2025-04-01");
  });

  it("disables unavailable dates", () => {
    render(
      <SmartDatePicker
        availableDates={["2025-05-10", "2025-05-20"]}
        selectedDate=""
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /select date/i }));

    const available = screen.getByRole("button", { name: /may 10, 2025/i });
    const unavailable = screen.getByRole("button", { name: /may 11, 2025/i });

    expect(available).not.toBeDisabled();
    expect(unavailable).toBeDisabled();
  });

  it("skips empty months while navigating", () => {
    const onChange = vi.fn();
    render(
      <SmartDatePicker
        availableDates={["2025-01-10", "2025-03-05"]}
        selectedDate="2025-03-05"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /select date/i }));
    fireEvent.click(screen.getByRole("button", { name: /previous month/i }));
    expect(
      screen.getByRole("button", { name: /january 10, 2025/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /february/i }),
    ).not.toBeInTheDocument();
  });

  it("handles an empty dataset gracefully", () => {
    render(
      <SmartDatePicker
        availableDates={[]}
        selectedDate=""
        onChange={vi.fn()}
        placeholder="No dates available"
      />,
    );

    expect(
      screen.getByRole("button", { name: /no dates available/i }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /no dates available/i }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores malformed dates safely", () => {
    const onChange = vi.fn();
    render(
      <SmartDatePicker
        availableDates={["2025-02-29", "bad-date", "2025-03-02"]}
        selectedDate="2025-02-29"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /select date/i }));
    expect(
      screen.getByRole("button", { name: /february 29, 2025/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /bad-date/i }),
    ).not.toBeInTheDocument();
  });

  it("does not call onChange when the selected prop changes", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SmartDatePicker
        availableDates={["2025-06-01", "2025-06-20"]}
        selectedDate="2025-06-01"
        onChange={onChange}
      />,
    );

    rerender(
      <SmartDatePicker
        availableDates={["2025-06-01", "2025-06-20"]}
        selectedDate="2025-06-20"
        onChange={onChange}
      />,
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports keyboard selection and Escape close", () => {
    const onChange = vi.fn();
    render(
      <SmartDatePicker
        availableDates={["2025-08-15", "2025-08-17"]}
        selectedDate="2025-08-15"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /select date/i }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("2025-08-17");

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("handles click outside and leap year date selection", () => {
    const onChange = vi.fn();
    render(
      <SmartDatePicker
        availableDates={["2024-02-29"]}
        selectedDate=""
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /select date/i }));
    fireEvent.click(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /select date/i }));
    fireEvent.click(screen.getByRole("button", { name: /february 29, 2024/i }));
    expect(onChange).toHaveBeenCalledWith("2024-02-29");
  });
});

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";
import { TabLogo } from "./TabLogo";
import { useApp } from "../context/AppContext";

vi.mock("../context/AppContext", () => ({
  useApp: vi.fn(),
}));

const baseContext = {
  activeTab: "admin" as const,
  setActiveTab: vi.fn(),
  pickers: [],
};

describe("Sidebar TabLogo integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue(baseContext as any);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a logo in the sidebar without the demo chrome", () => {
    render(<Sidebar />);

    expect(
      screen.getByRole("button", { name: /tab key logo/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/compare overlay/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/copy svg/i)).not.toBeInTheDocument();
    expect(screen.getByText("Node Telemetry")).toBeInTheDocument();
  });

  it("places the logo between the navigation and the telemetry footer", () => {
    render(<Sidebar />);

    const navItem = screen.getAllByRole("button", {
      name: /admin \/ input/i,
    })[0];
    const logo = screen.getByRole("button", { name: /tab key logo/i });
    const telemetry = screen.getByText("Node Telemetry");

    expect(
      navItem.compareDocumentPosition(logo) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      logo.compareDocumentPosition(telemetry) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("keeps the sidebar navigation wired to the app state", () => {
    const setActiveTab = vi.fn();
    vi.mocked(useApp).mockReturnValue({
      ...baseContext,
      activeTab: "dashboard",
      setActiveTab,
    } as any);

    render(<Sidebar />);
    fireEvent.click(screen.getAllByRole("button", { name: /branch kpis/i })[0]);

    expect(setActiveTab).toHaveBeenCalledWith("branch-kpis");
  });

  it("supports pointer and keyboard interaction and blocks form navigation", () => {
    render(<TabLogo />);

    const button = screen.getByRole("button", { name: /tab key logo/i });
    expect(button).toHaveAttribute("type", "button");

    fireEvent.pointerDown(button);
    expect(button).toHaveAttribute("data-pressed", "true");

    fireEvent.pointerUp(button);
    expect(button).toHaveAttribute("data-pressed", "false");

    fireEvent.keyDown(button, { key: "Enter" });
    expect(button).toHaveAttribute("data-pressed", "true");

    fireEvent.keyUp(button, { key: "Enter" });
    expect(button).toHaveAttribute("data-pressed", "false");
  });

  it("does not crash when audio context is unavailable", () => {
    const originalAudioContext = window.AudioContext;
    // @ts-expect-error test intentionally removes browser audio support
    window.AudioContext = undefined;

    render(<TabLogo />);
    const button = screen.getByRole("button", { name: /tab key logo/i });

    expect(() => fireEvent.pointerDown(button)).not.toThrow();

    window.AudioContext = originalAudioContext;
  });
});

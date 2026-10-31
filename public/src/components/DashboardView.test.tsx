import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardView } from "./DashboardView";
import { useApp } from "../context/AppContext";

vi.mock("../context/AppContext", () => ({
  useApp: vi.fn(),
}));

const mockPickers = [
  {
    id: "P-1",
    name: "Ava",
    zone: "North · A",
    orders: 120,
    velocityScore: 97,
    tierColor: "#22c55e",
  },
  {
    id: "P-2",
    name: "Ben",
    zone: "South · B",
    orders: 108,
    velocityScore: 94,
    tierColor: "#38bdf8",
  },
  {
    id: "P-3",
    name: "Cora",
    zone: "West · C",
    orders: 101,
    velocityScore: 91,
    tierColor: "#f59e0b",
  },
];

describe("DashboardView leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue({
      setActiveTab: vi.fn(),
      setSelectedTelemetryPicker: vi.fn(),
      pickers: mockPickers,
      branchKpis: {
        CR: {
          historyData: [{ date: "2026-10-30", value: 92 }],
          currentValue: 92,
        },
      },
      branchKpisStatus: "loaded",
      branchKpisError: null,
      currentUser: {
        displayName: "Ops Supervisor",
        id: "1",
        username: "ops",
        role: "admin",
      },
      logout: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it("removes demo state toggle controls and preserves rankings and roster navigation", () => {
    const setActiveTab = vi.fn();
    vi.mocked(useApp).mockReturnValue({
      setActiveTab,
      setSelectedTelemetryPicker: vi.fn(),
      pickers: mockPickers,
      branchKpis: {
        CR: {
          historyData: [{ date: "2026-10-30", value: 92 }],
          currentValue: 92,
        },
      },
      branchKpisStatus: "loaded",
      branchKpisError: null,
      currentUser: {
        displayName: "Ops Supervisor",
        id: "1",
        username: "ops",
        role: "admin",
      },
      logout: vi.fn(),
    } as any);

    render(<DashboardView />);

    expect(
      screen.queryByRole("button", { name: /active/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /skeleton/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /empty/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /error/i }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Top 3 Pickers Leaderboard")).toBeInTheDocument();
    expect(screen.getByText("Ava")).toBeInTheDocument();
    expect(screen.getByText("Ben")).toBeInTheDocument();
    expect(screen.getByText("Cora")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /full roster/i }));
    expect(setActiveTab).toHaveBeenCalledWith("pickers");
  });
});

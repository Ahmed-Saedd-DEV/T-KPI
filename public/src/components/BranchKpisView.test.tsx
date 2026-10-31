// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../api/client";
import { INITIAL_BRANCH_KPIS } from "../data/initialData";
import { useApp } from "../context/AppContext";
import { BranchKpisView } from "./BranchKpisView";

vi.mock("../context/AppContext", () => ({
  useApp: vi.fn(),
}));

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockUseApp = vi.mocked(useApp);
const mockApiClient = vi.mocked(apiClient);

const defaultAppState = {
  branchKpis: INITIAL_BRANCH_KPIS,
  branchKpisStatus: "loaded",
  branchKpisError: null,
  fetchMetrics: vi.fn().mockResolvedValue({
    success: true,
    status: "loaded",
    empty: false,
    stale: false,
  }),
  activeKpiKey: "CR" as const,
  setActiveKpiKey: vi.fn(),
};

describe("BranchKpisView date range filter", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseApp.mockReturnValue(defaultAppState as any);
  });

  it("renders the from and to SmartDatePicker controls and loads available dates", async () => {
    mockApiClient.get.mockResolvedValue({
      data: { status: "success", data: ["2026-10-30", "2026-11-01"] },
    });

    render(<BranchKpisView />);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });

    expect(screen.getByRole("button", { name: "From date" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "To date" })).not.toBeNull();
  });

  it("keeps Apply disabled while a partial selection is incomplete", async () => {
    const user = userEvent.setup();
    mockApiClient.get.mockResolvedValue({
      data: { status: "success", data: ["2026-10-30", "2026-11-01"] },
    });

    render(<BranchKpisView />);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });

    await user.click(screen.getByRole("button", { name: "From date" }));
    await user.click(screen.getByLabelText("Previous month"));
    await user.click(screen.getByLabelText("October 30, 2026"));

    const applyButton = screen.getByRole("button", { name: "Apply Filter" });
    expect((applyButton as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText(/Select both dates to apply a filter/i),
    ).not.toBeNull();
  });

  it("disables Apply when the selected from date is after the to date", async () => {
    const user = userEvent.setup();
    mockApiClient.get.mockResolvedValue({
      data: { status: "success", data: ["2026-10-30", "2026-11-01"] },
    });

    render(<BranchKpisView />);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });

    await user.click(screen.getByRole("button", { name: "From date" }));
    await user.click(screen.getByLabelText("November 1, 2026"));
    await user.click(screen.getByRole("button", { name: "To date" }));
    await user.click(screen.getByLabelText("Previous month"));
    await user.click(screen.getByLabelText("October 30, 2026"));

    const applyButton = screen.getByRole("button", { name: "Apply Filter" });
    expect((applyButton as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText(/From date must be on or before To date/i),
    ).not.toBeNull();
  });

  it("accepts a same-day range and commits it on Apply", async () => {
    const user = userEvent.setup();
    mockApiClient.get.mockResolvedValue({
      data: { status: "success", data: ["2026-10-30", "2026-11-01"] },
    });

    render(<BranchKpisView />);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });

    await user.click(screen.getByRole("button", { name: "From date" }));
    await user.click(screen.getByLabelText("Previous month"));
    await user.click(screen.getByLabelText("October 30, 2026"));
    await user.click(screen.getByRole("button", { name: "To date" }));
    await user.click(screen.getByLabelText("Previous month"));
    await user.click(screen.getByLabelText("October 30, 2026"));

    const applyButton = screen.getByRole("button", { name: "Apply Filter" });
    expect((applyButton as HTMLButtonElement).disabled).toBe(false);

    await user.click(applyButton);

    expect(screen.getByText(/Date range selected/i)).not.toBeNull();
    expect(screen.getAllByText(/2026-10-30/).length).toBeGreaterThan(0);
  });

  it("clears the draft and applied filter state", async () => {
    const user = userEvent.setup();
    mockApiClient.get.mockResolvedValue({
      data: { status: "success", data: ["2026-10-30", "2026-11-01"] },
    });

    render(<BranchKpisView />);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });

    await user.click(screen.getByRole("button", { name: "From date" }));
    await user.click(screen.getByLabelText("Previous month"));
    await user.click(screen.getByLabelText("October 30, 2026"));
    await user.click(screen.getByRole("button", { name: "To date" }));
    await user.click(screen.getByLabelText("November 1, 2026"));
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await user.click(screen.getByRole("button", { name: "Clear Filter" }));

    expect(
      (
        screen.getByRole("button", {
          name: "Apply Filter",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.queryByText(/Date range selected/i)).toBeNull();
  });

  it("does not request KPI data through the shared AppContext while editing draft dates and commits the selected period on Apply", async () => {
    const user = userEvent.setup();
    const fetchMetrics = vi.fn().mockResolvedValue({
      success: true,
      status: "loaded",
      empty: false,
      stale: false,
    });

    mockUseApp.mockReturnValue({
      ...defaultAppState,
      fetchMetrics,
    } as any);

    mockApiClient.get.mockImplementation((url: string, config?: any) => {
      if (url === "/admin/metrics/daily/available-dates") {
        return Promise.resolve({
          data: { status: "success", data: ["2026-10-30", "2026-11-01"] },
        });
      }

      if (url === "/admin/metrics/daily") {
        return Promise.resolve({
          data: [
            {
              metricDate: "2026-10-30",
              opsCR: 91,
              prepTime: 18,
              orderCount: 220,
              atVendorTime: 12,
              adjustTime: 5,
              dispatchTime: 9,
            },
            {
              metricDate: "2026-11-01",
              opsCR: 93,
              prepTime: 16,
              orderCount: 240,
              atVendorTime: 11,
              adjustTime: 4,
              dispatchTime: 8,
            },
          ],
        });
      }

      return Promise.resolve({ data: { data: [] } });
    });

    render(<BranchKpisView />);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });

    expect(fetchMetrics).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "From date" }));
    await user.click(screen.getByLabelText("Previous month"));
    await user.click(screen.getByLabelText("October 30, 2026"));

    expect(fetchMetrics).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "To date" }));
    await user.click(screen.getByLabelText("November 1, 2026"));

    expect(fetchMetrics).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/metrics/daily", {
        params: { from: "2026-10-30", to: "2026-11-01" },
      });
    });
    expect(fetchMetrics).not.toHaveBeenCalled();
  });

  it("clears the active filter without triggering the global KPI fetch contract", async () => {
    const user = userEvent.setup();
    const fetchMetrics = vi.fn().mockResolvedValue({
      success: true,
      status: "loaded",
      empty: false,
      stale: false,
    });

    mockUseApp.mockReturnValue({
      ...defaultAppState,
      fetchMetrics,
    } as any);

    mockApiClient.get.mockImplementation((url: string, config?: any) => {
      if (url === "/admin/metrics/daily/available-dates") {
        return Promise.resolve({
          data: { status: "success", data: ["2026-10-30", "2026-11-01"] },
        });
      }

      if (url === "/admin/metrics/daily") {
        return Promise.resolve({
          data: [
            {
              metricDate: "2026-10-30",
              opsCR: 91,
              prepTime: 18,
              orderCount: 220,
              atVendorTime: 12,
              adjustTime: 5,
              dispatchTime: 9,
            },
            {
              metricDate: "2026-11-01",
              opsCR: 93,
              prepTime: 16,
              orderCount: 240,
              atVendorTime: 11,
              adjustTime: 4,
              dispatchTime: 8,
            },
          ],
        });
      }

      return Promise.resolve({ data: { data: [] } });
    });

    render(<BranchKpisView />);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });

    await user.click(screen.getByRole("button", { name: "From date" }));
    await user.click(screen.getByLabelText("Previous month"));
    await user.click(screen.getByLabelText("October 30, 2026"));
    await user.click(screen.getByRole("button", { name: "To date" }));
    await user.click(screen.getByLabelText("November 1, 2026"));
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/metrics/daily", {
        params: { from: "2026-10-30", to: "2026-11-01" },
      });
    });

    fetchMetrics.mockClear();

    await user.click(screen.getByRole("button", { name: "Clear Filter" }));

    expect(fetchMetrics).not.toHaveBeenCalled();
    expect(screen.queryByText(/Date range selected/i)).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Apply Filter",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("keeps filtered requests local to BranchKpisView instead of writing through AppContext", async () => {
    const user = userEvent.setup();
    const fetchMetrics = vi.fn().mockResolvedValue({
      success: true,
      status: "loaded",
      empty: false,
      stale: false,
    });

    mockUseApp.mockReturnValue({
      ...defaultAppState,
      fetchMetrics,
    } as any);

    mockApiClient.get.mockImplementation((url: string, config?: any) => {
      if (url === "/admin/metrics/daily/available-dates") {
        return Promise.resolve({
          data: { status: "success", data: ["2026-10-30", "2026-11-01"] },
        });
      }

      if (url === "/admin/metrics/daily") {
        return Promise.resolve({
          data: [
            {
              metricDate: "2026-10-30",
              opsCR: 91,
              prepTime: 18,
              orderCount: 220,
              atVendorTime: 12,
              adjustTime: 5,
              dispatchTime: 9,
            },
            {
              metricDate: "2026-11-01",
              opsCR: 93,
              prepTime: 16,
              orderCount: 240,
              atVendorTime: 11,
              adjustTime: 4,
              dispatchTime: 8,
            },
          ],
        });
      }

      return Promise.resolve({ data: { data: [] } });
    });

    render(<BranchKpisView />);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });

    await user.click(screen.getByRole("button", { name: "From date" }));
    await user.click(screen.getByLabelText("Previous month"));
    await user.click(screen.getByLabelText("October 30, 2026"));
    await user.click(screen.getByRole("button", { name: "To date" }));
    await user.click(screen.getByLabelText("November 1, 2026"));

    expect(fetchMetrics).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/metrics/daily", {
        params: { from: "2026-10-30", to: "2026-11-01" },
      });
    });

    expect(fetchMetrics).not.toHaveBeenCalled();
  });
});

import "@testing-library/jest-dom/vitest";
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../api/client";
import { useApp } from "../context/AppContext";
import { PickersView } from "./PickersView";

vi.mock("../context/AppContext", () => ({
  useApp: vi.fn(),
}));

const buildEmployee = (
  employeeCode: string,
  name: string,
  score = 85,
  orders = 12,
) => ({
  id: employeeCode,
  employeeCode,
  name,
  orders,
  metrics: {
    opsCR: score / 100,
    dispatchTime: 4,
    pickingTime: 3.5,
    assignmentTime: 2,
    prepTime: 1.5,
  },
  kpi: {
    overallScore: score,
    scores: {
      overall: score,
      opsCR: score,
      dispatchTime: score,
      pickingTime: score,
      assignmentTime: score,
      prepTime: score,
    },
  },
});

const baseContext = {
  pickers: [],
  pickersError: null,
  fetchPickers: vi.fn(),
  addPicker: vi.fn(() => ({ success: true })),
  removePicker: vi.fn(() => true),
  selectedTelemetryPicker: null,
  setSelectedTelemetryPicker: vi.fn(),
  isAddPickerOpen: false,
  setIsAddPickerOpen: vi.fn(),
  isRemovePickerOpen: false,
  setIsRemovePickerOpen: vi.fn(),
};

describe("PickersView upload date filter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue(baseContext as any);
  });

  afterEach(() => {
    cleanup();
  });

  it("loads the latest completed batch on first render", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        data: [buildEmployee("P-100", "Alpha")],
        pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
      },
    });

    render(<PickersView />);

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });

    expect(getSpy).toHaveBeenCalledWith(
      "/employees",
      expect.objectContaining({
        params: expect.objectContaining({
          mode: "latest-batch",
          page: 1,
          limit: 100,
        }),
      }),
    );
  });

  it("loads available dates and passes them to the SmartDatePicker", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/employees/available-dates") {
        return {
          data: {
            status: "success",
            data: ["2025-04-20", "2025-04-25", "2025-04-30"],
          },
        } as any;
      }

      return {
        data: {
          data: [buildEmployee("P-100", "Alpha")],
          pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
        },
      } as any;
    });

    render(<PickersView />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/employees/available-dates");
    });

    const trigger = await screen.findByRole("button", { name: "Upload Date" });
    fireEvent.click(trigger);

    expect(screen.getByLabelText("April 20, 2025")).toBeInTheDocument();
    expect(screen.getByLabelText("April 25, 2025")).toBeInTheDocument();
  });

  it("selecting a SmartDatePicker value triggers upload-date mode", async () => {
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockImplementation(async (url) => {
        if (url === "/employees/available-dates") {
          return {
            data: {
              status: "success",
              data: ["2025-04-25"],
            },
          } as any;
        }

        return {
          data: {
            data: [buildEmployee("P-204", "Bravo", 92, 30)],
            pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
          },
        } as any;
      });

    render(<PickersView />);

    const trigger = await screen.findByRole("button", { name: "Upload Date" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByLabelText("April 25, 2025"));

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        "/employees",
        expect.objectContaining({
          params: expect.objectContaining({
            mode: "upload-date",
            uploadDate: "2025-04-25",
          }),
        }),
      );
    });
  });

  it("clears a stale selected date after a successful availability refresh", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url, config) => {
      const params = (config?.params ?? {}) as Record<string, any>;
      if (url === "/employees/available-dates") {
        return {
          data: {
            status: "success",
            data: ["2025-04-20", "2025-04-25"],
          },
        } as any;
      }

      if (params.mode === "upload-date") {
        return {
          data: {
            data: [buildEmployee("P-204", "Bravo", 92, 30)],
            pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
          },
        } as any;
      }

      return {
        data: {
          data: [buildEmployee("P-100", "Alpha")],
          pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
        },
      } as any;
    });

    render(<PickersView />);

    const trigger = await screen.findByRole("button", { name: "Upload Date" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByLabelText("April 25, 2025"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Upload Date" }),
      ).toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledWith("/employees/available-dates");
  });

  it("switches to a selected upload date and restores latest-batch when cleared", async () => {
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockImplementation(async (url, config) => {
        const params = (config?.params ?? {}) as Record<string, any>;
        if (url === "/employees/available-dates") {
          return {
            data: {
              status: "success",
              data: ["2025-04-25"],
            },
          } as any;
        }

        if (
          params.mode === "upload-date" &&
          params.uploadDate === "2025-04-25"
        ) {
          return {
            data: {
              data: [buildEmployee("P-204", "Bravo", 92, 30)],
              pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
            },
          } as any;
        }

        return {
          data: {
            data: [buildEmployee("P-100", "Alpha", 88, 20)],
            pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
          },
        } as any;
      });

    render(<PickersView />);

    const dateTrigger = await screen.findByRole("button", {
      name: "Upload Date",
    });
    fireEvent.click(dateTrigger);
    fireEvent.click(screen.getByLabelText("April 25, 2025"));

    await waitFor(() => {
      expect(screen.getByText("Bravo")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear Date" }));

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        "/employees",
        expect.objectContaining({
          params: expect.objectContaining({ mode: "latest-batch" }),
        }),
      );
    });
  });

  it("shows the empty state when the selected date has no matching records", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        data: [],
        pagination: { total: 0, totalPages: 1, limit: 100, page: 1 },
      },
    });

    render(<PickersView />);

    await waitFor(() => {
      expect(screen.getByText("No pickers found")).toBeInTheDocument();
    });
  });

  it("surfaces a table load error without affecting the local add/remove actions", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("network"));
    render(<PickersView />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load pickers")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Failed to load picker data for the selected batch."),
    ).toBeInTheDocument();
  });

  it("loads every page when the result set exceeds 100 rows", async () => {
    const pageOne = Array.from({ length: 100 }, (_, index) =>
      buildEmployee(
        `P-${index + 1}`,
        `Picker ${index + 1}`,
        80 + (index % 10),
        index + 1,
      ),
    );
    const pageTwo = [buildEmployee("P-101", "Picker 101", 96, 101)];

    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockImplementation(async (_url, config) => {
        const page =
          (config?.params as Record<string, any> | undefined)?.page ?? 1;
        if (page === 1) {
          return {
            data: {
              data: pageOne,
              pagination: { total: 101, totalPages: 2, limit: 100, page: 1 },
            },
          } as any;
        }

        return {
          data: {
            data: pageTwo,
            pagination: { total: 101, totalPages: 2, limit: 100, page: 2 },
          },
        } as any;
      });

    render(<PickersView />);

    await waitFor(() => {
      expect(screen.getByText("Picker 101")).toBeInTheDocument();
    });

    expect(getSpy).toHaveBeenCalledTimes(3);
    expect(getSpy).toHaveBeenCalledWith(
      "/employees",
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, limit: 100 }),
      }),
    );
    expect(getSpy).toHaveBeenCalledWith(
      "/employees",
      expect.objectContaining({
        params: expect.objectContaining({ page: 2, limit: 100 }),
      }),
    );
    expect(getSpy).toHaveBeenCalledWith("/employees/available-dates");
  });

  it("ignores stale responses from older fetches so newer date selections win", async () => {
    let resolveFirst: ((value: unknown) => void) | undefined;
    const firstRequest = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockImplementation(async (url, config) => {
        const params = (config?.params ?? {}) as Record<string, any>;
        if (url === "/employees/available-dates") {
          return {
            data: {
              status: "success",
              data: ["2025-04-25"],
            },
          } as any;
        }

        if (params.mode === "latest-batch") {
          return firstRequest.then(() => ({
            data: {
              data: [buildEmployee("P-OLD", "Old Batch", 70, 9)],
              pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
            },
          }));
        }

        return {
          data: {
            data: [buildEmployee("P-NEW", "New Batch", 95, 45)],
            pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
          },
        } as any;
      });

    render(<PickersView />);

    const dateTrigger = await screen.findByRole("button", {
      name: "Upload Date",
    });
    fireEvent.click(dateTrigger);
    fireEvent.click(screen.getByLabelText("April 25, 2025"));

    await waitFor(() => {
      expect(screen.getByText("New Batch")).toBeInTheDocument();
    });

    resolveFirst?.({
      data: {
        data: [buildEmployee("P-OLD", "Old Batch", 70, 9)],
        pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
      },
    });

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalled();
    });
    expect(screen.queryByText("Old Batch")).not.toBeInTheDocument();
  });

  it("removes a picker from the visible table immediately without modifying backend records", async () => {
    const removePicker = vi.fn(() => true);
    let removeModalOpen = true;

    vi.mocked(useApp).mockImplementation(
      () =>
        ({
          ...baseContext,
          pickers: [
            {
              id: "P-100",
              name: "Alpha",
              zone: "Warehouse Floor",
              orders: 12,
              velocityScore: 85,
              tier: "excellent",
              tierLabel: "Excellent",
              tierColor: "#22C55E",
              subBadge: "Test",
              telemetry: {
                orders: 12,
                pickingTime: "3.0h",
                assignmentTime: "2.0h",
                prepTime: "1.0h",
                dispatchTime: "1.0h",
                opsCr: "92%",
                detailedZone: "Warehouse Floor",
              },
            },
          ],
          isRemovePickerOpen: removeModalOpen,
          setIsRemovePickerOpen: vi.fn((next) => {
            removeModalOpen =
              typeof next === "function" ? next(removeModalOpen) : next;
          }),
          removePicker,
        }) as any,
    );

    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        data: [buildEmployee("P-100", "Alpha", 85, 12)],
        pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
      },
    });

    const { rerender } = render(<PickersView />);

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Alpha/i));
    const confirmButtons = screen.getAllByRole("button", {
      name: /remove picker/i,
    });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    rerender(<PickersView />);

    await new Promise((resolve) => setTimeout(resolve, 850));

    await waitFor(() => {
      expect(removePicker).toHaveBeenCalledWith("P-100");
    });
    await waitFor(() => {
      expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    });
  });

  it("keeps local removals effective when a fetch resolves after the active selection changes", async () => {
    const removePicker = vi.fn(() => true);
    let removeModalOpen = true;

    vi.mocked(useApp).mockImplementation(
      () =>
        ({
          ...baseContext,
          pickers: [
            {
              id: "P-200",
              name: "Beta",
              zone: "Warehouse Floor",
              orders: 18,
              velocityScore: 80,
              tier: "very_good",
              tierLabel: "Very Good",
              tierColor: "#A3E635",
              subBadge: "Test",
              telemetry: {
                orders: 18,
                pickingTime: "3.0h",
                assignmentTime: "2.0h",
                prepTime: "1.0h",
                dispatchTime: "1.0h",
                opsCr: "83%",
                detailedZone: "Warehouse Floor",
              },
            },
          ],
          isRemovePickerOpen: removeModalOpen,
          setIsRemovePickerOpen: vi.fn((next) => {
            removeModalOpen =
              typeof next === "function" ? next(removeModalOpen) : next;
          }),
          removePicker,
        }) as any,
    );

    let resolveFetch: ((value: unknown) => void) | undefined;
    const delayedResponse = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    vi.spyOn(apiClient, "get").mockImplementation(
      async () => delayedResponse as any,
    );

    const { rerender } = render(<PickersView />);

    await waitFor(() => {
      expect(screen.getByText("Loading picker data...")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Beta/i));
    const confirmButtons = screen.getAllByRole("button", {
      name: /remove picker/i,
    });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    rerender(<PickersView />);

    await new Promise((resolve) => setTimeout(resolve, 850));

    resolveFetch?.({
      data: {
        data: [buildEmployee("P-200", "Beta", 80, 18)],
        pagination: { total: 1, totalPages: 1, limit: 100, page: 1 },
      },
    });

    await waitFor(() => {
      expect(removePicker).toHaveBeenCalledWith("P-200");
    });
    await waitFor(() => {
      expect(screen.queryByText("Beta")).not.toBeInTheDocument();
    });
  });

  it("does not surface a manually added picker as historical performance data when no backend result exists", async () => {
    vi.mocked(useApp).mockReturnValue({
      ...baseContext,
      pickers: [
        {
          id: "P-999",
          name: "Local Only",
          zone: "Warehouse Floor",
          orders: 0,
          velocityScore: 88,
          tier: "very_good",
          tierLabel: "Very Good",
          tierColor: "#A3E635",
          subBadge: "New Registration",
          telemetry: {
            orders: 0,
            pickingTime: "—",
            assignmentTime: "—",
            prepTime: "—",
            dispatchTime: "—",
            opsCr: "—",
            detailedZone: "Warehouse Floor",
          },
        },
      ],
    } as any);

    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        data: [],
        pagination: { total: 0, totalPages: 1, limit: 100, page: 1 },
      },
    });

    render(<PickersView />);

    await waitFor(() => {
      expect(screen.getByText("No pickers found")).toBeInTheDocument();
    });

    expect(screen.queryByText("Local Only")).not.toBeInTheDocument();
  });
});

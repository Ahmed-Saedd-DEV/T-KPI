import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../api/client";
import { useApp } from "../context/AppContext";
import { AdminInputView } from "./AdminInputView";

vi.mock("../context/AppContext", () => ({
  useApp: vi.fn(),
}));

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockUseApp = vi.mocked(useApp);
const mockApiClient = vi.mocked(apiClient);

const clickButtonByText = async (label: string) => {
  const target = Array.from(document.querySelectorAll("button")).find(
    (button) => button.textContent?.includes(label),
  ) as HTMLButtonElement | undefined;

  expect(target).toBeTruthy();
  await userEvent.click(target!);
};

const openBranchKpiTab = async () => {
  await clickButtonByText("Branch KPI Input");
};

const openEditMode = async () => {
  await clickButtonByText("Edit Mode");
};

const getSmartDateTrigger = () => {
  const trigger = Array.from(document.querySelectorAll("button")).find(
    (button) => {
      const aria = button.getAttribute("aria-label") ?? "";
      const text = button.textContent ?? "";
      return (
        aria.includes("KPI date") ||
        text.includes("Select saved KPI date") ||
        text.includes("Select a saved KPI date")
      );
    },
  ) as HTMLButtonElement | undefined;

  expect(trigger).toBeTruthy();
  return trigger!;
};

describe("AdminInputView Branch KPI edit flow", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseApp.mockReturnValue({
      branchKpis: {},
      recentUploads: [],
      addUploadRecord: vi.fn(),
      currentUser: { displayName: "Ops Admin", role: "ADMIN" },
      logout: vi.fn(),
      fetchMetrics: vi.fn().mockResolvedValue({
        success: true,
        status: "loaded",
        empty: false,
        stale: false,
      }),
    } as any);
  });

  it("loads available dates and selects a saved date for the edit workflow", async () => {
    const user = userEvent.setup();

    mockApiClient.get.mockImplementation((url: string) => {
      if (url === "/admin/metrics/daily/available-dates") {
        return Promise.resolve({
          data: { status: "success", data: ["2025-01-01", "2025-01-03"] },
        });
      }

      if (url === "/admin/metrics/daily/2025-01-03") {
        return Promise.resolve({
          data: {
            metricDate: "2025-01-03",
            opsCR: 42,
            dispatchTime: null,
            prepTime: null,
            assignmentTime: null,
            orderCount: null,
            atVendorTime: null,
            adjustTime: null,
          },
        });
      }

      return Promise.resolve({ data: {} });
    });

    render(<AdminInputView />);

    await openBranchKpiTab();
    await openEditMode();

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });

    fireEvent.click(getSmartDateTrigger());
    fireEvent.click(
      Array.from(document.querySelectorAll("button")).find(
        (button) => button.getAttribute("aria-label") === "January 3, 2025",
      ) as HTMLButtonElement,
    );

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/2025-01-03",
      );
    });

    const valueInputs = Array.from(
      document.querySelectorAll('input[type="number"]'),
    ) as HTMLInputElement[];
    expect(valueInputs.some((input) => input.value === "42")).toBe(true);
  });

  it("refreshes available edit dates after a successful Branch KPI create save", async () => {
    const saveSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: { status: "COMPLETED", imported: 1 },
    });

    mockApiClient.get.mockImplementation((url: string) => {
      if (url === "/admin/metrics/daily/available-dates") {
        return Promise.resolve({
          data: { status: "success", data: ["2025-01-03"] },
        });
      }

      return Promise.resolve({ data: {} });
    });

    render(<AdminInputView />);

    await openBranchKpiTab();

    const createDateInput = document.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    fireEvent.change(createDateInput, { target: { value: "2025-01-07" } });

    const valueInput = document.querySelectorAll(
      'input[type="number"]',
    )[0] as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: "42" } });

    fireEvent.click(
      Array.from(document.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Save CR"),
      ) as HTMLButtonElement,
    );

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });
  });

  it("refreshes available edit dates after a successful Branch KPI update", async () => {
    mockApiClient.get.mockImplementation((url: string) => {
      if (url === "/admin/metrics/daily/available-dates") {
        return Promise.resolve({
          data: { status: "success", data: ["2025-01-03"] },
        });
      }

      if (url === "/admin/metrics/daily/2025-01-03") {
        return Promise.resolve({
          data: {
            metricDate: "2025-01-03",
            opsCR: 18,
            dispatchTime: null,
            prepTime: null,
            assignmentTime: null,
            orderCount: null,
            atVendorTime: null,
            adjustTime: null,
          },
        });
      }

      return Promise.resolve({ data: {} });
    });

    mockApiClient.patch.mockResolvedValue({ data: { status: "success" } });

    render(<AdminInputView />);

    await openBranchKpiTab();
    await openEditMode();

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });

    fireEvent.click(getSmartDateTrigger());
    fireEvent.click(
      Array.from(document.querySelectorAll("button")).find(
        (button) => button.getAttribute("aria-label") === "January 3, 2025",
      ) as HTMLButtonElement,
    );

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/2025-01-03",
      );
    });

    await waitFor(() => {
      expect(document.querySelector('input[type="number"]')).toBeTruthy();
    });

    const proposedInput = document.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;
    fireEvent.change(proposedInput, { target: { value: "42" } });

    await waitFor(() => {
      expect(
        Array.from(document.querySelectorAll("button")).some((button) =>
          button.textContent?.includes("Review update"),
        ),
      ).toBe(true);
    });

    await clickButtonByText("Review update");

    await waitFor(() => {
      expect(
        Array.from(document.querySelectorAll("button")).some((button) =>
          button.textContent?.includes("Confirm update"),
        ),
      ).toBe(true);
    });

    await clickButtonByText("Confirm update");

    await waitFor(() => {
      expect(mockApiClient.patch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/metrics/daily/available-dates",
      );
    });
  });

  it("does not refresh available edit dates after a failed Branch KPI save", async () => {
    mockApiClient.post.mockRejectedValue({
      response: { data: { message: "Save rejected" } },
    });

    mockApiClient.get.mockImplementation((url: string) => {
      if (url === "/admin/metrics/daily/available-dates") {
        return Promise.resolve({
          data: { status: "success", data: ["2025-01-03"] },
        });
      }

      return Promise.resolve({ data: {} });
    });

    render(<AdminInputView />);

    await openBranchKpiTab();

    const valueInput = document.querySelectorAll(
      'input[type="number"]',
    )[0] as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: "42" } });

    fireEvent.click(
      Array.from(document.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Save CR"),
      ) as HTMLButtonElement,
    );

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalled();
    });

    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });

  it("clears an invalid selected edit date after a successful available-dates refresh", async () => {
    mockApiClient.get.mockImplementation((url: string) => {
      if (url === "/admin/metrics/daily/available-dates") {
        return Promise.resolve({
          data: { status: "success", data: ["2025-01-03"] },
        });
      }

      return Promise.resolve({ data: {} });
    });

    render(<AdminInputView />);

    await openBranchKpiTab();
    await openEditMode();

    await waitFor(() => {
      expect(document.body.textContent).toContain(
        "Selected date is no longer available",
      );
    });

    expect(getSmartDateTrigger()).toBeTruthy();
  });

  it("keeps the create workflow unrestricted while edit dates are tracked separately", async () => {
    render(<AdminInputView />);

    await openBranchKpiTab();

    const createDateInput = document.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    fireEvent.change(createDateInput, { target: { value: "2025-02-15" } });

    expect(createDateInput.value).toBe("2025-02-15");
    expect(
      Array.from(document.querySelectorAll("button")).some((button) =>
        button.textContent?.includes("Edit Mode"),
      ),
    ).toBe(true);
  });

  it("shows an API failure without deleting the current edit selection", async () => {
    mockApiClient.get.mockImplementation((url: string) => {
      if (url === "/admin/metrics/daily/available-dates") {
        return Promise.reject({
          response: {
            data: { message: "Unavailable KPI dates endpoint failed" },
          },
        });
      }

      return Promise.resolve({ data: {} });
    });

    render(<AdminInputView />);

    await openBranchKpiTab();
    await openEditMode();

    await waitFor(() => {
      expect(document.body.textContent).toContain(
        "Saved KPI dates unavailable",
      );
    });

    expect(document.body.textContent).toContain(
      "Unavailable KPI dates endpoint failed",
    );
  });

  it("handles an empty available-dates response gracefully", async () => {
    mockApiClient.get.mockImplementation((url: string) => {
      if (url === "/admin/metrics/daily/available-dates") {
        return Promise.resolve({ data: { status: "success", data: [] } });
      }

      return Promise.resolve({ data: {} });
    });

    render(<AdminInputView />);

    await openBranchKpiTab();
    await openEditMode();

    await waitFor(() => {
      expect(getSmartDateTrigger()).toBeTruthy();
    });
  });
});

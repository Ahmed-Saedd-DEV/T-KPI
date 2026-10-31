import React, { useEffect, useMemo, useRef, useState } from "react";

export type SmartDatePickerProps = {
  availableDates: string[];
  selectedDate: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  emptyStateMessage?: string;
  ariaLabel?: string;
};

type ParsedDate = {
  year: number;
  month: number;
  day: number;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const pad2 = (value: number) => String(value).padStart(2, "0");

function parseDateParts(value: string): ParsedDate | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { year, month, day };
}

function toDateKey(date: ParsedDate) {
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
}

function monthKeyForParts(date: ParsedDate) {
  return `${date.year}-${pad2(date.month)}`;
}

function toDisplayLabel(value: string) {
  const parsed = parseDateParts(value);
  if (!parsed) {
    return value;
  }

  return `${monthNames[parsed.month - 1]} ${parsed.day}, ${parsed.year}`;
}

function normalizeAvailableDates(values: string[]) {
  const unique = new Set<string>();

  for (const value of values) {
    const parsed = parseDateParts(value);
    if (!parsed) {
      continue;
    }

    unique.add(toDateKey(parsed));
  }

  return [...unique].sort((left, right) => left.localeCompare(right));
}

function getMonthKeys(dates: string[]) {
  const keys = new Set<string>();

  for (const date of dates) {
    const parsed = parseDateParts(date);
    if (!parsed) {
      continue;
    }

    keys.add(monthKeyForParts(parsed));
  }

  return [...keys].sort();
}

function getCalendarDays(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const firstOfMonth = new Date(year, month - 1, 1);
  const leadingDays = firstOfMonth.getDay();
  const cells: Array<{
    key: string;
    label: string;
    isCurrentMonth: boolean;
    date: Date;
  }> = [];

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - leadingDays + 1;
    const date = new Date(year, month - 1, dayNumber);
    const isCurrentMonth = dayNumber > 0 && dayNumber <= 31;
    const keyYear = dayNumber <= 0 ? date.getFullYear() : year;
    const keyMonth = dayNumber <= 0 ? date.getMonth() + 1 : month;
    const keyDay = dayNumber <= 0 ? date.getDate() : dayNumber;
    const dateKey = `${keyYear}-${pad2(keyMonth)}-${pad2(keyDay)}`;

    cells.push({
      key: dateKey,
      label: `${monthNames[(keyMonth - 1 + 12) % 12]} ${keyDay}, ${keyYear}`,
      isCurrentMonth,
      date,
    });
  }

  return { cells };
}

export const SmartDatePicker: React.FC<SmartDatePickerProps> = ({
  availableDates,
  selectedDate,
  onChange,
  disabled = false,
  loading = false,
  placeholder = "Select date",
  emptyStateMessage = "No dates available",
  ariaLabel = "Select date",
}) => {
  const normalizedDates = useMemo(
    () => normalizeAvailableDates(availableDates),
    [availableDates],
  );
  const availableSet = useMemo(
    () => new Set(normalizedDates),
    [normalizedDates],
  );
  const monthKeys = useMemo(
    () => getMonthKeys(normalizedDates),
    [normalizedDates],
  );

  const defaultMonth = useMemo(() => {
    if (!monthKeys.length) {
      return null;
    }

    const selectedParsed = parseDateParts(selectedDate);
    if (selectedParsed && availableSet.has(toDateKey(selectedParsed))) {
      return monthKeyForParts(selectedParsed);
    }

    return monthKeys[monthKeys.length - 1];
  }, [monthKeys, availableSet, selectedDate]);

  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<string | null>(defaultMonth);
  const focusRef = useRef<string | null>(
    selectedDate && availableSet.has(selectedDate)
      ? selectedDate
      : (normalizedDates[0] ?? null),
  );
  const [focusDate, setFocusDate] = useState<string | null>(focusRef.current);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!visibleMonth && defaultMonth) {
      setVisibleMonth(defaultMonth);
    }

    const preferredFocus =
      selectedDate && availableSet.has(selectedDate)
        ? selectedDate
        : visibleMonth
          ? (normalizedDates.find((date) => {
              const parsed = parseDateParts(date);
              return (
                parsed !== null && monthKeyForParts(parsed) === visibleMonth
              );
            }) ??
            normalizedDates[0] ??
            null)
          : (normalizedDates[0] ?? null);

    if (preferredFocus && preferredFocus !== focusRef.current) {
      focusRef.current = preferredFocus;
      setFocusDate(preferredFocus);
    }
  }, [
    isOpen,
    defaultMonth,
    visibleMonth,
    normalizedDates,
    selectedDate,
    availableSet,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("click", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("click", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const visibleMonthDates = useMemo(() => {
    if (!visibleMonth) {
      return [];
    }

    const [yearText, monthText] = visibleMonth.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    const monthDates = normalizedDates.filter((date) => {
      const parsed = parseDateParts(date);
      return parsed !== null && parsed.year === year && parsed.month === month;
    });

    return monthDates;
  }, [normalizedDates, visibleMonth]);

  const goToMonth = (direction: 1 | -1) => {
    if (!monthKeys.length) {
      return;
    }

    const currentKey =
      visibleMonth ?? defaultMonth ?? monthKeys[monthKeys.length - 1];
    const currentIndex = monthKeys.indexOf(currentKey);
    const nextIndex = Math.min(
      Math.max(currentIndex + direction, 0),
      monthKeys.length - 1,
    );

    const nextMonth = monthKeys[nextIndex];
    setVisibleMonth(nextMonth);

    const nextDate = normalizedDates.find((date) => {
      const parsed = parseDateParts(date);
      return parsed !== null && monthKeyForParts(parsed) === nextMonth;
    });

    if (nextDate) {
      setFocusDate(nextDate);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!visibleMonthDates.length) {
      return;
    }

    const currentDate = focusRef.current ?? focusDate ?? visibleMonthDates[0];
    const currentIndex = visibleMonthDates.indexOf(currentDate);
    const activeIndex = currentIndex >= 0 ? currentIndex : 0;

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = Math.min(activeIndex + 1, visibleMonthDates.length - 1);
      const nextDate = visibleMonthDates[nextIndex];
      focusRef.current = nextDate;
      setFocusDate(nextDate);
      document.getElementById(`smart-date-day-${nextDate}`)?.focus();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const nextIndex = Math.max(activeIndex - 1, 0);
      const nextDate = visibleMonthDates[nextIndex];
      focusRef.current = nextDate;
      setFocusDate(nextDate);
      document.getElementById(`smart-date-day-${nextDate}`)?.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.min(activeIndex + 7, visibleMonthDates.length - 1);
      const nextDate = visibleMonthDates[nextIndex];
      focusRef.current = nextDate;
      setFocusDate(nextDate);
      document.getElementById(`smart-date-day-${nextDate}`)?.focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = Math.max(activeIndex - 7, 0);
      const nextDate = visibleMonthDates[nextIndex];
      focusRef.current = nextDate;
      setFocusDate(nextDate);
      document.getElementById(`smart-date-day-${nextDate}`)?.focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const nextDate = focusRef.current ?? currentDate;
      if (nextDate) {
        onChange(nextDate);
      }
    }
  };

  const triggerLabel =
    selectedDate && availableSet.has(selectedDate) ? selectedDate : placeholder;

  if (!normalizedDates.length) {
    return (
      <div className="relative inline-block min-w-0 w-full max-w-[220px]">
        <button
          type="button"
          disabled={disabled || loading}
          aria-label={triggerLabel}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-sm text-[#E2E8F0] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate">{triggerLabel}</span>
          {loading ? (
            <span className="text-xs text-[#38BDF8]">Loading…</span>
          ) : (
            <span className="text-[#94A3B8]">▾</span>
          )}
        </button>
      </div>
    );
  }

  const monthKey =
    visibleMonth ?? defaultMonth ?? monthKeys[monthKeys.length - 1];
  const [yearText, monthText] = monthKey.split("-");
  const monthDate = new Date(Number(yearText), Number(monthText) - 1, 1);
  const grid = getCalendarDays(monthKey);

  return (
    <div
      className="relative inline-block min-w-0 w-full max-w-[260px]"
      ref={containerRef}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-sm text-[#E2E8F0] shadow-sm transition-colors hover:border-[#334155] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{triggerLabel}</span>
        <span className="flex items-center gap-2 text-[#94A3B8]">
          {loading ? (
            <span className="text-xs text-[#38BDF8]">Loading…</span>
          ) : (
            <span>▾</span>
          )}
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Date picker calendar"
          onKeyDown={onKeyDown}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[280px] rounded-xl border border-[#1E293B] bg-[#0F172A] p-3 shadow-2xl shadow-[#020817]/60"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => goToMonth(-1)}
              className="rounded-md border border-[#1E293B] bg-[#111827] px-2 py-1 text-sm text-[#E2E8F0] transition-colors hover:border-[#334155] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              ←
            </button>
            <div className="text-sm font-semibold text-[#F8FAFC]">
              {new Intl.DateTimeFormat("en-US", {
                month: "long",
                year: "numeric",
              }).format(monthDate)}
            </div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => goToMonth(1)}
              className="rounded-md border border-[#1E293B] bg-[#111827] px-2 py-1 text-sm text-[#E2E8F0] transition-colors hover:border-[#334155] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              →
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
            {weekdayLabels.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div
            role="grid"
            aria-label="Available date grid"
            className="grid grid-cols-7 gap-1"
          >
            {grid.cells.map((cell) => {
              const key = cell.key;
              const isSelectable = cell.isCurrentMonth && availableSet.has(key);
              const isSelected = selectedDate === key;
              const isFocus = focusDate === key;

              return (
                <button
                  key={key}
                  id={`smart-date-day-${key}`}
                  type="button"
                  disabled={!isSelectable}
                  aria-label={cell.label}
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-md text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]",
                    cell.isCurrentMonth ? "text-[#E2E8F0]" : "text-[#475569]",
                    isSelectable
                      ? isSelected
                        ? "bg-[#38BDF8] text-[#082f49] font-bold"
                        : isFocus
                          ? "bg-[#1E293B] text-[#F8FAFC] ring-1 ring-[#38BDF8]"
                          : "hover:bg-[#1E293B]"
                      : "cursor-not-allowed bg-transparent text-[#475569]",
                  ].join(" ")}
                  onClick={() => {
                    if (isSelectable) {
                      onChange(key);
                      setIsOpen(false);
                    }
                  }}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          {!visibleMonthDates.length && (
            <div className="mt-3 rounded-md border border-dashed border-[#334155] bg-[#0B1120] p-3 text-center text-xs text-[#94A3B8]">
              {emptyStateMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartDatePicker;

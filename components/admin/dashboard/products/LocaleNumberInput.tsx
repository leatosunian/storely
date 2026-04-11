"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";

const locale = "es-AR";

/**
 * Format the integer part with thousand separators only.
 * Decimal part (after comma) is left as-is so the user can keep typing.
 */
function formatWithSeparators(raw: string): string {
  // Strip everything except digits and comma
  const cleaned = raw.replace(/[^\d,]/g, "");
  if (cleaned === "") return "";

  const parts = cleaned.split(",");
  // Format integer part with dots as thousand separators
  const intPart = parts[0].replace(/^0+(?=\d)/, ""); // strip leading zeros
  const formatted =
    (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";

  if (parts.length > 1) {
    // Keep only first 2 decimal digits
    const decPart = parts[1].slice(0, 2);
    return `${formatted},${decPart}`;
  }

  // Preserve trailing comma so user can type decimals
  if (raw.endsWith(",")) return `${formatted},`;

  return formatted;
}

/** Parse an es-AR formatted string ("1.234,56") into a number (1234.56). */
function parseLocale(str: string): number {
  const cleaned = str.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned);
}

/** Format a number fully for display (used on blur / initial sync). */
function formatFull(num: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

interface LocaleNumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  value: number | string;
  onChange: (value: number) => void;
  onBlur?: () => void;
  name?: string;
}

/**
 * Number input that displays values with es-AR locale formatting (e.g. 1.234,56)
 * live as the user types.
 * Designed to work with react-hook-form field spread: `<LocaleNumberInput {...field} />`
 */
export const LocaleNumberInput = React.forwardRef<
  HTMLInputElement,
  LocaleNumberInputProps
>(({ value, onChange, onBlur, ...props }, ref) => {
  const [display, setDisplay] = useState("");
  const focused = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Merge forwarded ref with local ref
  const setRefs = useCallback(
    (el: HTMLInputElement | null) => {
      inputRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
    },
    [ref]
  );

  // Sync display from form value when not editing
  useEffect(() => {
    if (focused.current) return;
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num) || value === "" || value == null) {
      setDisplay("");
    } else {
      setDisplay(formatFull(num));
    }
  }, [value]);

  const handleFocus = () => {
    focused.current = true;
  };

  const handleBlur = () => {
    focused.current = false;
    const parsed = parseLocale(display);
    if (!isNaN(parsed)) {
      setDisplay(formatFull(parsed));
      onChange(parsed);
    } else if (display === "") {
      setDisplay("");
      onChange(0);
    }
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const rawValue = el.value;
    const cursorPos = el.selectionStart ?? rawValue.length;

    // Count how many digits + commas are before the cursor in the raw input
    const rawBeforeCursor = rawValue.slice(0, cursorPos);
    const significantBefore = rawBeforeCursor.replace(/\./g, "").length;

    const formatted = formatWithSeparators(rawValue);
    setDisplay(formatted);

    // Restore cursor: walk through formatted string until we've passed the
    // same number of significant (non-dot) characters
    let newCursor = 0;
    let count = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (count >= significantBefore) break;
      if (formatted[i] !== ".") count++;
      newCursor = i + 1;
    }

    // Defer cursor restoration to after React commits the value
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    });

    const parsed = parseLocale(formatted);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (formatted === "") {
      onChange(0);
    }
  };

  return (
    <Input
      ref={setRefs}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onWheel={(e) => e.currentTarget.blur()}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
      }}
      {...props}
    />
  );
});

LocaleNumberInput.displayName = "LocaleNumberInput";

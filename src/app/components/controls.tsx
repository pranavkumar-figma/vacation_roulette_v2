import type { ReactNode } from "react";
import { clsx } from "clsx";
import type { Selection } from "react-aria-components";
import {
  Button,
  Label,
  TagToggle,
  TagToggleGroup,
  TagToggleList,
  TextSmall,
} from "primitives";

/**
 * External link styled as an SDS Button. Used for outbound deep links where we
 * need `target`/`rel`, which the SDS Button type doesn't expose.
 */
export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "medium",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "neutral" | "subtle";
  size?: "small" | "medium";
}) {
  const className = clsx("button", `button-size-${size}`, `button-variant-${variant}`);
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function LabeledField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="vr-field">
      <Label>{label}</Label>
      {children}
      {error ? (
        <TextSmall style={{ color: "var(--sds-color-text-danger-default)" }}>
          {error}
        </TextSmall>
      ) : hint ? (
        <TextSmall className="vr-muted">{hint}</TextSmall>
      ) : null}
    </div>
  );
}

export interface ChipOption {
  key: string;
  label: string;
}

function selectionToArray(selection: Selection, all: string[]): string[] {
  if (selection === "all") return all;
  return Array.from(selection).map(String);
}

/**
 * Chip group built on the SDS TagToggle primitives. Supports single-select
 * (segmented control) and multi-select (vibe / interests / dealbreakers).
 */
export function ChipGroup({
  label,
  options,
  value,
  onChange,
  mode = "multiple",
}: {
  label: string;
  options: ChipOption[];
  value: string[];
  onChange: (next: string[]) => void;
  mode?: "single" | "multiple";
}) {
  const allKeys = options.map((o) => o.key);
  return (
    <TagToggleGroup
      aria-label={label}
      selectionMode={mode}
      disallowEmptySelection={mode === "single"}
      selectedKeys={new Set(value)}
      onSelectionChange={(keys) => onChange(selectionToArray(keys, allKeys))}
    >
      <TagToggleList className="vr-chips">
        {options.map((o) => (
          <TagToggle key={o.key} id={o.key}>
            {o.label}
          </TagToggle>
        ))}
      </TagToggleList>
    </TagToggleGroup>
  );
}

export function Stepper({
  value,
  min = 1,
  max = 12,
  onChange,
  ariaLabel,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className="vr-stepper" role="group" aria-label={ariaLabel}>
      <Button
        variant="neutral"
        size="small"
        isDisabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease"
      >
        −
      </Button>
      <span aria-live="polite" style={{ minWidth: "2ch", textAlign: "center" }}>
        {value}
      </span>
      <Button
        variant="neutral"
        size="small"
        isDisabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase"
      >
        +
      </Button>
    </div>
  );
}

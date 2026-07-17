"use client";

import * as React from "react";

import {
  formatBrazilianPhone,
  formatCep,
  formatCpfCnpj,
  formatCurrencyInputBR,
  formatCurrencyInputFromReais,
  formatPercentageInputFromBasisPoints,
  formatDecimalInputBR,
  parseDecimalBR,
  normalizeProperName,
  normalizeProperNameInput,
  onlyDigits,
} from "@/lib/br-formatters";
import { Input, type InputProps } from "@/components/ui/input";

type TextValueProps = Omit<InputProps, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
};

type NumberValueProps = Omit<InputProps, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (value: number) => void;
};

export const ProperNameInput = React.forwardRef<HTMLInputElement, TextValueProps>(
  ({ value, onValueChange, onBlur, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      value={value}
      onChange={(event) => onValueChange(normalizeProperNameInput(event.target.value))}
      onBlur={(event) => {
        onValueChange(normalizeProperName(event.currentTarget.value));
        onBlur?.(event);
      }}
    />
  ),
);
ProperNameInput.displayName = "ProperNameInput";

export const BrazilianPhoneInput = React.forwardRef<HTMLInputElement, TextValueProps>(
  ({ value, onValueChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      inputMode="tel"
      autoComplete="tel-national"
      value={formatBrazilianPhone(value)}
      onChange={(event) => onValueChange(onlyDigits(event.target.value).slice(0, 11))}
    />
  ),
);
BrazilianPhoneInput.displayName = "BrazilianPhoneInput";

export const CpfCnpjInput = React.forwardRef<HTMLInputElement, TextValueProps>(
  ({ value, onValueChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      inputMode="numeric"
      value={formatCpfCnpj(value)}
      onChange={(event) => onValueChange(onlyDigits(event.target.value).slice(0, 14))}
    />
  ),
);
CpfCnpjInput.displayName = "CpfCnpjInput";

export const BrazilianCepInput = React.forwardRef<HTMLInputElement, TextValueProps>(
  ({ value, onValueChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      inputMode="numeric"
      autoComplete="postal-code"
      value={formatCep(value)}
      onChange={(event) => onValueChange(onlyDigits(event.target.value).slice(0, 8))}
    />
  ),
);
BrazilianCepInput.displayName = "BrazilianCepInput";

export const CurrencyCentsInput = React.forwardRef<HTMLInputElement, NumberValueProps>(
  ({ value, onValueChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      inputMode="numeric"
      value={formatCurrencyInputBR(value)}
      onChange={(event) => {
        const digits = onlyDigits(event.target.value);
        onValueChange(digits ? Number(digits) : 0);
      }}
    />
  ),
);
CurrencyCentsInput.displayName = "CurrencyCentsInput";

export const CurrencyReaisInput = React.forwardRef<HTMLInputElement, NumberValueProps>(
  ({ value, onValueChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      inputMode="numeric"
      value={formatCurrencyInputFromReais(value)}
      onChange={(event) => {
        const digits = onlyDigits(event.target.value);
        onValueChange(digits ? Number(digits) / 100 : 0);
      }}
    />
  ),
);
CurrencyReaisInput.displayName = "CurrencyReaisInput";

export const PercentageBasisPointsInput = React.forwardRef<
  HTMLInputElement,
  NumberValueProps
>(({ value, onValueChange, ...props }, ref) => (
  <Input
    {...props}
    ref={ref}
    inputMode="numeric"
    value={formatPercentageInputFromBasisPoints(value)}
    onChange={(event) => {
      const digits = onlyDigits(event.target.value);
      onValueChange(digits ? Number(digits) : 0);
    }}
  />
));
PercentageBasisPointsInput.displayName = "PercentageBasisPointsInput";

type CurrencyTextInputProps = Omit<InputProps, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
  allowNegative?: boolean;
};

export const CurrencyTextInput = React.forwardRef<HTMLInputElement, CurrencyTextInputProps>(
  ({ value, onValueChange, allowNegative = false, ...props }, ref) => {
    const negative = allowNegative && String(value).trim().startsWith("-");
    const digits = onlyDigits(value);
    const display = digits
      ? `${negative ? "-" : ""}${formatCurrencyInputBR(Number(digits))}`
      : value === "-" && allowNegative
        ? "-"
        : "";

    return (
      <Input
        {...props}
        ref={ref}
        inputMode="numeric"
        value={display}
        onChange={(event) => {
          const raw = event.target.value;
          const nextNegative = allowNegative && raw.trim().startsWith("-");
          const nextDigits = onlyDigits(raw);
          onValueChange(nextDigits ? `${nextNegative ? "-" : ""}${formatCurrencyInputBR(Number(nextDigits))}` : nextNegative ? "-" : "");
        }}
      />
    );
  },
);
CurrencyTextInput.displayName = "CurrencyTextInput";

type UncontrolledNumericProps = Omit<InputProps, "defaultValue" | "type"> & {
  defaultValue?: number;
  maximumFractionDigits?: number;
};

export const DecimalBRInput = React.forwardRef<
  HTMLInputElement,
  UncontrolledNumericProps
>(({ defaultValue = 0, maximumFractionDigits = 3, onBlur, ...props }, ref) => {
  const [display, setDisplay] = React.useState(() =>
    formatDecimalInputBR(defaultValue, maximumFractionDigits),
  );
  return (
    <Input
      {...props}
      ref={ref}
      inputMode="decimal"
      value={display}
      onChange={(event) => setDisplay(event.target.value.replace(/[^0-9.,-]/g, ""))}
      onBlur={(event) => {
        setDisplay(
          formatDecimalInputBR(
            parseDecimalBR(event.currentTarget.value),
            maximumFractionDigits,
          ),
        );
        onBlur?.(event);
      }}
    />
  );
});
DecimalBRInput.displayName = "DecimalBRInput";

export const CurrencyFormInput = React.forwardRef<
  HTMLInputElement,
  UncontrolledNumericProps
>(({ defaultValue = 0, onBlur, ...props }, ref) => {
  const [display, setDisplay] = React.useState(() => formatCurrencyInputBR(defaultValue));
  return (
    <Input
      {...props}
      ref={ref}
      inputMode="numeric"
      value={display}
      onChange={(event) => {
        const digits = onlyDigits(event.target.value);
        setDisplay(formatCurrencyInputBR(digits ? Number(digits) : 0));
      }}
      onBlur={onBlur}
    />
  );
});
CurrencyFormInput.displayName = "CurrencyFormInput";

export const PercentageFormInput = React.forwardRef<
  HTMLInputElement,
  UncontrolledNumericProps
>(({ defaultValue = 0, onBlur, ...props }, ref) => {
  const [display, setDisplay] = React.useState(() =>
    formatPercentageInputFromBasisPoints(defaultValue),
  );
  return (
    <Input
      {...props}
      ref={ref}
      inputMode="numeric"
      value={display}
      onChange={(event) => {
        const digits = onlyDigits(event.target.value);
        setDisplay(formatPercentageInputFromBasisPoints(digits ? Number(digits) : 0));
      }}
      onBlur={onBlur}
    />
  );
});
PercentageFormInput.displayName = "PercentageFormInput";

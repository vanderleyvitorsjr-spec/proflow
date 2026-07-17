"use client";

import * as React from "react";

import {
  formatBrazilianPhone,
  formatCep,
  formatCpfCnpj,
  formatCurrencyInputBR,
  formatCurrencyInputFromReais,
  formatPercentageInputFromBasisPoints,
  normalizeProperName,
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
      onChange={(event) => onValueChange(event.target.value)}
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

export const PercentageBasisPointsInput = React.forwardRef<HTMLInputElement, NumberValueProps>(
  ({ value, onValueChange, ...props }, ref) => (
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
  ),
);
PercentageBasisPointsInput.displayName = "PercentageBasisPointsInput";

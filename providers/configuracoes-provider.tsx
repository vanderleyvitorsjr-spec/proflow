"use client";

import { useCallback, useEffect } from "react";

import { getAppearanceSettingsAction } from "@/app/dashboard/configuracoes/configuracoes-actions";

import { useTheme } from "./theme-provider";

export function ConfiguracoesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();

  const apply = useCallback(async () => {
    const result = await getAppearanceSettingsAction();
    if (!result.ok) return;

    const { appearance } = result.data;
    const root = document.documentElement;

    setTheme(appearance.theme);
    root.dataset.density = appearance.density;
    root.dataset.contrast = appearance.contrast;
    root.dataset.fontSize = appearance.fontSize;
    root.dataset.reducedMotion = String(appearance.reducedMotion);
    root.dataset.accent = appearance.accent;
    root.dataset.radius = appearance.radius;
  }, [setTheme]);

  useEffect(() => {
    void apply();

    const update = () => void apply();
    window.addEventListener("proflow:configuracoes:updated", update);

    return () =>
      window.removeEventListener("proflow:configuracoes:updated", update);
  }, [apply]);

  return children;
}

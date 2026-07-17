"use client";

import { CircleHelp } from "lucide-react";

import { cn } from "@/lib/utils";

export function HelpHint({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <CircleHelp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}

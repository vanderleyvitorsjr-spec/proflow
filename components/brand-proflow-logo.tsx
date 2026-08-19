import Image from "next/image";

import { cn } from "@/lib/utils";

export function ProFlowLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="ProFlow">
      <Image
        src="/proflow-icon-192.png"
        alt=""
        width={40}
        height={40}
        priority
        className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-white/10"
      />
      {!compact ? (
        <span className="text-[1.08rem] font-extrabold tracking-[-0.025em] text-sidebar-foreground">
          ProFlow
        </span>
      ) : null}
    </span>
  );
}

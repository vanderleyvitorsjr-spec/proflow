import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  label: string;
}

export function IconButton({ label, title, ...props }: IconButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={label}
      title={title ?? label}
      {...props}
    />
  );
}

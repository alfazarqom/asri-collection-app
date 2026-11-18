import type { ComponentProps, ReactNode } from "react";
import { SfDrawer } from "@storefront-ui/react";

type StorefrontDrawerProps = ComponentProps<typeof SfDrawer>;
export type AsriDrawerPosition = "left" | "right" | "top" | "bottom";
export interface AsriDrawerProps extends Omit<StorefrontDrawerProps, "placement" | "children"> {
  children: ReactNode;
  position?: AsriDrawerPosition;
}

export function AsriDrawer({ children, position = "right", className = "", ...props }: AsriDrawerProps) {
  return (
    <SfDrawer
      {...props}
      placement={position}
      className={`asri-drawer ${className}`.trim()}
    >
      {children}
    </SfDrawer>
  );
}

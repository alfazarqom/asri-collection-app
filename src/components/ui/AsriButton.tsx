import type { ComponentProps, ReactNode } from "react";
import { SfButton } from "@storefront-ui/react";

type StorefrontButtonProps = ComponentProps<typeof SfButton>;
export type AsriButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type AsriButtonSize = "sm" | "md" | "lg";

export interface AsriButtonProps extends Omit<StorefrontButtonProps, "variant" | "size" | "children"> {
  children: ReactNode;
  variant?: AsriButtonVariant;
  size?: AsriButtonSize;
  loading?: boolean;
}

const variantClasses: Record<AsriButtonVariant, string> = {
  primary: "!bg-[#24382c] !text-white hover:!bg-[#405947]",
  secondary: "!border !border-[#cbd5cc] !bg-white !text-[#24382c] hover:!bg-[#f0f2ed]",
  tertiary: "!bg-transparent !text-[#405947] hover:!bg-[#edf1ec]",
  danger: "!bg-[#984b40] !text-white hover:!bg-[#7e3d34]",
};

const sizeClasses: Record<AsriButtonSize, string> = {
  sm: "!min-h-9 !px-3 !text-xs",
  md: "!min-h-11 !px-5 !text-sm",
  lg: "!min-h-12 !px-6 !text-sm",
};

export function AsriButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...props
}: AsriButtonProps) {
  return (
    <SfButton
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`!rounded-md !font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
    >
      {children}
    </SfButton>
  );
}

import type { ComponentProps } from "react";
import { SfButton, SfInput, SfSelect, SfTextarea } from "@storefront-ui/react";
export * from "@storefront-ui/react";

type ButtonProps = ComponentProps<typeof SfButton>;
type InputProps = ComponentProps<typeof SfInput>;
type SelectProps = ComponentProps<typeof SfSelect>;
type TextareaProps = ComponentProps<typeof SfTextarea>;

export function AsriButton({ className = "", variant = "primary", ...props }: ButtonProps) {
  return <SfButton {...props} variant={variant} className={["asri-sf-button", className].filter(Boolean).join(" ")} />;
}

export function AsriInput({ className = "", wrapperClassName = "", ...props }: InputProps) {
  return (
    <SfInput
      {...props}
      className={["asri-sf-input", className].filter(Boolean).join(" ")}
      wrapperClassName={["asri-sf-input-wrapper", wrapperClassName].filter(Boolean).join(" ")}
    />
  );
}

export function AsriSelect({ className = "", wrapperClassName = "", ...props }: SelectProps) {
  return (
    <SfSelect
      {...props}
      className={["asri-sf-select", className].filter(Boolean).join(" ")}
      wrapperClassName={["asri-sf-select-wrapper", wrapperClassName].filter(Boolean).join(" ")}
    />
  );
}

export function AsriTextarea({ className = "", ...props }: TextareaProps) {
  return <SfTextarea {...props} className={["asri-sf-textarea", className].filter(Boolean).join(" ")} />;
}

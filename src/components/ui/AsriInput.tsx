import { useId, type ChangeEventHandler, type ComponentProps } from "react";
import { SfInput } from "@storefront-ui/react";

type StorefrontInputProps = ComponentProps<typeof SfInput>;
export interface AsriInputProps extends Omit<StorefrontInputProps, "invalid" | "id" | "onChange"> {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export function AsriInput({ id, label, helperText, error, className = "", ...props }: AsriInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = error || helperText ? `${inputId}-message` : undefined;

  return (
    <div className="asri-field">
      {label && <label className="asri-field__label" htmlFor={inputId}>{label}</label>}
      <SfInput
        {...props}
        id={inputId}
        invalid={Boolean(error)}
        aria-describedby={messageId}
        className={`asri-control ${className}`.trim()}
      />
      {error ? <p className="asri-field__error" id={messageId} role="alert">{error}</p>
        : helperText ? <p className="asri-field__hint" id={messageId}>{helperText}</p> : null}
    </div>
  );
}

import { useId, type ComponentProps } from "react";
import { SfSelect } from "@storefront-ui/react";

type StorefrontSelectProps = ComponentProps<typeof SfSelect>;
export interface AsriSelectProps extends Omit<StorefrontSelectProps, "invalid" | "id"> {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
}

export function AsriSelect({ id, label, helperText, error, className = "", children, ...props }: AsriSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = error || helperText ? `${selectId}-message` : undefined;

  return (
    <div className="asri-field">
      {label && <label className="asri-field__label" htmlFor={selectId}>{label}</label>}
      <SfSelect
        {...props}
        id={selectId}
        invalid={Boolean(error)}
        aria-describedby={messageId}
        className={`asri-control ${className}`.trim()}
      >
        {children}
      </SfSelect>
      {error ? <p className="asri-field__error" id={messageId} role="alert">{error}</p>
        : helperText ? <p className="asri-field__hint" id={messageId}>{helperText}</p> : null}
    </div>
  );
}

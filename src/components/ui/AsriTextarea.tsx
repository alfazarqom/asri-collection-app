import { useId, type ChangeEventHandler, type ComponentProps } from "react";
import { SfTextarea } from "@storefront-ui/react";

type StorefrontTextareaProps = ComponentProps<typeof SfTextarea>;
export interface AsriTextareaProps extends Omit<StorefrontTextareaProps, "invalid" | "id" | "onChange"> {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
}

export function AsriTextarea({ id, label, helperText, error, className = "", ...props }: AsriTextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const messageId = error || helperText ? `${textareaId}-message` : undefined;

  return (
    <div className="asri-field">
      {label && <label className="asri-field__label" htmlFor={textareaId}>{label}</label>}
      <SfTextarea
        {...props}
        id={textareaId}
        invalid={Boolean(error)}
        aria-describedby={messageId}
        className={`asri-control asri-control--textarea ${className}`.trim()}
      />
      {error ? <p className="asri-field__error" id={messageId} role="alert">{error}</p>
        : helperText ? <p className="asri-field__hint" id={messageId}>{helperText}</p> : null}
    </div>
  );
}

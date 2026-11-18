import { useId, type ComponentProps } from "react";
import { SfRadio } from "@storefront-ui/react";

type StorefrontRadioProps = ComponentProps<typeof SfRadio>;
export interface AsriRadioProps extends Omit<StorefrontRadioProps, "id"> {
  id?: string;
  label: string;
  helperText?: string;
}

export function AsriRadio({ id, label, helperText, className = "", ...props }: AsriRadioProps) {
  const generatedId = useId();
  const radioId = id ?? generatedId;

  return (
    <div className="asri-choice">
      <SfRadio {...props} id={radioId} className={`asri-choice__control ${className}`.trim()} />
      <div>
        <label className="asri-choice__label" htmlFor={radioId}>{label}</label>
        {helperText && <p className="asri-field__hint">{helperText}</p>}
      </div>
    </div>
  );
}

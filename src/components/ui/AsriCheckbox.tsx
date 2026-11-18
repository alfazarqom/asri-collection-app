import { useId, type ComponentProps } from "react";
import { SfCheckbox } from "@storefront-ui/react";

type StorefrontCheckboxProps = ComponentProps<typeof SfCheckbox>;
export interface AsriCheckboxProps extends Omit<StorefrontCheckboxProps, "id"> {
  id?: string;
  label: string;
  helperText?: string;
}

export function AsriCheckbox({ id, label, helperText, className = "", ...props }: AsriCheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className="asri-choice">
      <SfCheckbox {...props} id={checkboxId} className={`asri-choice__control ${className}`.trim()} />
      <div>
        <label className="asri-choice__label" htmlFor={checkboxId}>{label}</label>
        {helperText && <p className="asri-field__hint">{helperText}</p>}
      </div>
    </div>
  );
}

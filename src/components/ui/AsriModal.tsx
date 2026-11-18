import { useId, type ComponentProps, type ReactNode } from "react";
import { SfButton, SfModal } from "@storefront-ui/react";

type StorefrontModalProps = ComponentProps<typeof SfModal>;
export interface AsriModalProps extends Omit<StorefrontModalProps, "children" | "aria-labelledby"> {
  children: ReactNode;
  title: string;
  closeLabel?: string;
}

export function AsriModal({ children, title, closeLabel = "Tutup", onClose, className = "", ...props }: AsriModalProps) {
  const titleId = useId();

  return (
    <SfModal
      {...props}
      onClose={onClose}
      aria-labelledby={titleId}
      className={`asri-modal ${className}`.trim()}
    >
      <section className="asri-modal__content">
        <header className="asri-modal__header">
          <h2 id={titleId}>{title}</h2>
          <SfButton variant="tertiary" onClick={onClose} aria-label={closeLabel} className="asri-modal__close">
            {closeLabel}
          </SfButton>
        </header>
        <div>{children}</div>
      </section>
    </SfModal>
  );
}

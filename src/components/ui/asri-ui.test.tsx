import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AsriButton,
  AsriCheckbox,
  AsriDrawer,
  AsriInput,
  AsriModal,
  AsriRadio,
  AsriSelect,
  AsriTextarea,
} from "./index";

describe("Asri UI wrappers", () => {
  it("exports all eight wrapper components", () => {
    for (const component of [AsriButton, AsriInput, AsriSelect, AsriCheckbox, AsriRadio, AsriTextarea, AsriDrawer, AsriModal]) {
      expect(component).toBeTypeOf("function");
    }
  });

  it("renders the Asri button variant and content", () => {
    const markup = renderToStaticMarkup(<AsriButton variant="primary">Lanjutkan</AsriButton>);
    expect(markup).toContain("Lanjutkan");
    expect(markup).toContain("24382c");
  });

  it("renders labelled input, select, checkbox, radio and textarea primitives", () => {
    const markup = renderToStaticMarkup(
      <>
        <AsriInput label="Nama" value="Asri" readOnly />
        <AsriSelect label="Ukuran" value="M" onChange={() => undefined}>
          <option value="M">M</option>
        </AsriSelect>
        <AsriCheckbox label="Setuju" checked onChange={() => undefined} />
        <AsriRadio label="Reguler" name="shipping" value="regular" checked onChange={() => undefined} />
        <AsriTextarea label="Catatan" value="Pesan" readOnly />
      </>
    );
    expect(markup).toContain("Nama");
    expect(markup).toContain("Ukuran");
    expect(markup).toContain("Setuju");
    expect(markup).toContain("Reguler");
    expect(markup).toContain("Catatan");
  });

  it("keeps closed overlay wrappers render-safe", () => {
    const markup = renderToStaticMarkup(
      <>
        <AsriDrawer open={false} onClose={() => undefined}>Cart</AsriDrawer>
        <AsriModal open={false} onClose={() => undefined} title="Konfirmasi">Isi dialog</AsriModal>
      </>
    );
    expect(markup).toBeDefined();
  });
});

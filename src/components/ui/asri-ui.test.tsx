import { describe, expect, it } from "vitest";
import { createElement } from "react";
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
    const markup = renderToStaticMarkup(createElement(AsriButton, { variant: "primary" }, "Lanjutkan"));
    expect(markup).toContain("Lanjutkan");
    expect(markup).toContain("24382c");
  });

  it("renders labelled input, select, checkbox, radio and textarea primitives", () => {
    const markup = renderToStaticMarkup(
      <>
        {createElement(AsriInput, { label: "Nama", value: "Asri", readOnly: true })}
        {createElement(AsriSelect, { label: "Ukuran", value: "M", onChange: () => undefined },
          createElement("option", { value: "M" }, "M"))}
        {createElement(AsriCheckbox, { label: "Setuju", checked: true, onChange: () => undefined })}
        {createElement(AsriRadio, { label: "Reguler", name: "shipping", value: "regular", checked: true, onChange: () => undefined })}
        {createElement(AsriTextarea, { label: "Catatan", value: "Pesan", readOnly: true })}
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
        {createElement(AsriDrawer, { open: false, onClose: () => undefined }, "Cart")}
        {createElement(AsriModal, { open: false, onClose: () => undefined, title: "Konfirmasi" }, "Isi dialog")}
      </>
    );
    expect(markup).toBeDefined();
  });
});

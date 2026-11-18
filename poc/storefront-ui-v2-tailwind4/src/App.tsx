import { useState } from "react";
import { SfButton, SfInput } from "@storefront-ui/react";

export default function App() {
  const [email, setEmail] = useState("");

  return (
    <main className="min-h-screen bg-[#f8f8f5] px-5 py-12 text-[#1f2924] sm:px-8">
      <section className="mx-auto max-w-4xl">
        <header className="mb-12 border-b border-[#e6e8e2] pb-6">
          <p className="text-xs font-semibold tracking-[0.28em] text-[#718076]">ASRI COLLECTION</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
            Storefront UI V2 compatibility POC
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#667269]">
            Isolated test for React 18.3.1, Vite 6 and Tailwind CSS 4. No production
            application code, Supabase connection or payment integration is used here.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <article className="rounded-xl border border-[#e1e5df] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#718076]">Component test</p>
            <h2 className="mt-2 text-xl font-medium">SfButton</h2>
            <p className="my-4 text-sm leading-6 text-[#667269]">
              Confirms the React component can be imported and styled with Tailwind utilities.
            </p>
            <SfButton className="!rounded-md !bg-[#24382c] !text-white hover:!bg-[#405947]">
              Test Storefront UI button
            </SfButton>
          </article>

          <article className="rounded-xl border border-[#e1e5df] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#718076]">Form test</p>
            <h2 className="mt-2 text-xl font-medium">SfInput</h2>
            <p className="my-4 text-sm leading-6 text-[#667269]">
              Confirms component styles, controlled input behavior and custom class merging.
            </p>
            <SfInput
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              aria-label="Email address"
              className="!text-sm"
            />
            <p className="mt-3 break-all text-xs text-[#718076]">
              Input value: {email || "—"}
            </p>
          </article>
        </div>

        <footer className="mt-10 border-t border-[#e1e5df] pt-5 text-xs text-[#718076]">
          POC only · React 18 · Tailwind CSS 4 · Vite 6 · Storefront UI React 3.0.0
        </footer>
      </section>
    </main>
  );
}
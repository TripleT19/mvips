// src/app/components/Faq.tsx
import JsonLd from "@/app/components/JsonLd";

export type FaqItem = { q: string; a: string };

export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            Frequently Asked Questions
          </p>
          <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
            Everything parents ask us.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {items.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#252B68]/30 hover:shadow-md sm:p-6"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
                <span className="text-base font-black text-[#252B68] sm:text-lg">
                  {item.q}
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#252B68]/5 text-sm font-black text-[#252B68] transition group-open:rotate-45 group-open:bg-[#F58220] group-open:text-white">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }}
      />
    </section>
  );
}
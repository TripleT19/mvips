import Link from "next/link";
import { notFound } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function getNewsletter(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/newsletters/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function NewsletterDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const newsletter = await getNewsletter(params.slug);
  if (!newsletter) notFound();

  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href="/newsletters"
          className="text-sm font-bold text-[#252B68] hover:underline"
        >
          ← Back to newsletters
        </Link>

        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-[#F58220]">
            {newsletter.term ? `${newsletter.term} · ` : ""}
            {newsletter.year}
          </p>

          <h1 className="mt-3 text-3xl font-black text-[#252B68]">
            {newsletter.title}
          </h1>

          {newsletter.description && (
            <p className="mt-5 leading-8 text-slate-600">
              {newsletter.description}
            </p>
          )}

          <a
            href={`${API_URL}/api/newsletters/${newsletter.slug}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#F58220] px-6 py-3.5 font-black text-white hover:bg-[#d96e12]"
          >
            Download PDF
            <span>↓</span>
          </a>
        </div>
      </div>
    </main>
  );
}
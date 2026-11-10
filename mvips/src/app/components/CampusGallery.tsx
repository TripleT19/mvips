"use client";

import { useState } from "react";
import ImageWithFallback from "./ImageWithFallback";

export type GalleryPhoto = {
  src: string;
  alt: string;
  category: string;
  caption?: string;
};

type Props = {
  photos: GalleryPhoto[];
  categories: { key: string; label: string; icon?: string }[];
};

export default function CampusGallery({ photos, categories }: Props) {
  const [active, setActive] = useState<string>("all");

  const filtered =
    active === "all" ? photos : photos.filter((p) => p.category === active);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {categories.map((cat) => {
          const isActive = active === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActive(cat.key)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black transition ${
                isActive
                  ? "bg-[#F58220] text-white shadow-lg"
                  : "border-2 border-[#252B68]/15 bg-white text-[#252B68] hover:-translate-y-0.5 hover:border-[#252B68]/40 hover:shadow-md"
              }`}
              aria-pressed={isActive}
            >
              {cat.icon && <span aria-hidden="true">{cat.icon}</span>}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Photo grid */}
      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((photo, i) => (
          <figure
            key={`${photo.src}-${i}`}
            className="group relative overflow-hidden rounded-3xl bg-slate-100 shadow-lg ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="aspect-square w-full overflow-hidden">
              <ImageWithFallback
                src={photo.src}
                alt={photo.alt}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 pt-8">
              <p className="text-xs font-black uppercase tracking-widest text-[#FFE900] sm:text-[10px]">
                {categories.find((c) => c.key === photo.category)?.label ?? ""}
              </p>
              <p className="mt-0.5 text-sm font-bold text-white">
                {photo.caption ?? photo.alt}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-sm font-bold text-slate-500">
          No photos in this category yet.
        </p>
      )}
    </div>
  );
}
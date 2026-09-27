"use client";

import Image from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  className = "",
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Fallback background */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#252B68] to-[#F58220]">
        <div className="text-center text-white">
          <Image
            src="/logo.jpg"
            alt=""
            width={80}
            height={80}
            className="mx-auto h-16 w-16 object-contain opacity-80"
          />

          <p className="mt-2 text-xs font-semibold uppercase tracking-wider">
            Mount View
          </p>
        </div>
      </div>

      {/* Actual image */}
      {!imageError && (
        <Image
          src={src}
          alt={alt}
          fill
          className="relative z-10 object-cover transition duration-500"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#F58220] text-white shadow-xl ring-4 ring-white/80 transition-all duration-300 hover:-translate-y-1 hover:bg-[#252B68] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#FFE900] sm:bottom-8 sm:right-8"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
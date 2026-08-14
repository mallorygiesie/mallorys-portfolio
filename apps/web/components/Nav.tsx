"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/projects", label: "Work" },
  { href: "/resume", label: "Resume" },
  { href: "/#about", label: "About" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#FAFAF9]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-stone-900 hover:text-indigo-600 transition-colors"
          onClick={() => setOpen(false)}
        >
          Mallory Giesie
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-8">
          {links.map(({ href, label }) => {
            const active = href !== "/#about" && pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors ${
                  active
                    ? "text-stone-900 font-medium"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <a
            href="mailto:mallorygiesie@icloud.com"
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-5 bg-stone-700 transition-transform origin-center ${
              open ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-stone-700 transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-stone-700 transition-transform origin-center ${
              open ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="sm:hidden border-t border-stone-200 bg-[#FAFAF9] px-6 py-5 flex flex-col gap-5">
          {links.map(({ href, label }) => {
            const active = href !== "/#about" && pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`text-sm transition-colors ${
                  active
                    ? "text-stone-900 font-medium"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <a
            href="mailto:mallorygiesie@icloud.com"
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            Contact
          </a>
        </nav>
      )}
    </header>
  );
}

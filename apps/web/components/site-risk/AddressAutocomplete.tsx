"use client";

import { useEffect, useRef, useState } from "react";

import { suggestAddresses, type AddressSuggestion } from "@/lib/site-risk/client";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (s: AddressSuggestion) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  disabled,
  placeholder,
  className,
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false); // don't re-query right after picking a suggestion

  // Debounced fetch as the user types.
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await suggestAddresses(q);
      if (cancelled) return;
      setSuggestions(res);
      setActive(-1);
      setOpen(res.length > 0);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (s: AddressSuggestion) => {
    skipNextFetch.current = true;
    onChange(s.label);
    onSelect?.(s);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative flex-1 min-w-0">
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            choose(suggestions[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        disabled={disabled}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={s.label}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`block w-full text-left px-3 py-1.5 text-[10px] leading-snug transition-colors ${
                  i === active ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
                } hover:bg-indigo-50`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

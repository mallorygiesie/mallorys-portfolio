"use client";

import { useEffect, useState } from "react";
import { fetchItems } from "@/lib/gift-app/client";
import type { Category, Item } from "@/types/gift-app";
import ItemTile from "./ItemTile";
import styles from "./TileGrid.module.css";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "beauty", label: "Beauty" },
  { value: "fashion", label: "Fashion" },
  { value: "home", label: "Home" },
  { value: "kitchen", label: "Kitchen" },
  { value: "other", label: "Other" },
];

export default function TileGrid() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchItems({ category: category as Category | undefined, top: 60 })
      .then((data) => { if (!cancelled) setItems(data); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`${styles.pill} ${category === c.value ? styles.pillActive : ""}`}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className={styles.state}>
          <div className={styles.spinner} />
        </div>
      )}

      {error && (
        <div className={styles.state}>
          <p className={styles.error}>Failed to load: {error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className={styles.state}>
          <p>No items yet. Try syncing Raindrop.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className={styles.grid}>
          {items.map((item, i) => (
            <ItemTile key={item.id} item={item} generateDelay={i * 600} />
          ))}
        </div>
      )}
    </div>
  );
}

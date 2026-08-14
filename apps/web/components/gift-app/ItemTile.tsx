"use client";

import { useEffect, useRef, useState } from "react";
import type { Item } from "@/types/gift-app";
import styles from "./ItemTile.module.css";

interface Props {
  item: Item;
  generateDelay?: number;
}

const BACKEND = process.env.NEXT_PUBLIC_GIFT_APP_API ?? "http://localhost:8000/api";

function proxyUrl(url: string): string {
  return `${BACKEND}/proxy/image?url=${encodeURIComponent(url)}`;
}

async function requestAiImage(item: Item): Promise<string> {
  const res = await fetch(`${BACKEND}/generate/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: item.title,
      summary: item.summary,
      style_keywords: item.style_keywords,
      category: item.category,
    }),
  });
  if (!res.ok) throw new Error("generation failed");
  const data = await res.json();
  return data.url as string;
}

function TextTile({ item, shimmer }: { item: Item; shimmer?: boolean }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.textTile} ${shimmer ? styles.shimmer : ""}`}
    >
      {item.category !== "other" && (
        <span className={styles.categoryLabel}>{item.category}</span>
      )}
      {item.summary
        ? <p className={styles.summary}>{item.summary}</p>
        : <p className={styles.textTitle}>{item.title}</p>
      }
      {item.summary && <p className={styles.textTitle}>{item.title}</p>}
      {item.tags.length > 0 && (
        <div className={styles.tags}>
          {item.tags.slice(0, 4).map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
    </a>
  );
}

export default function ItemTile({ item, generateDelay = 0 }: Props) {
  const [imgError, setImgError] = useState(false);
  const [aiUrl, setAiUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const attempted = useRef(false);

  const hasRealImage = !!item.image_url && !imgError;

  useEffect(() => {
    if (hasRealImage || attempted.current) return;
    attempted.current = true;

    const timer = setTimeout(async () => {
      setGenerating(true);
      try {
        const url = await requestAiImage(item);
        setAiUrl(url);
      } catch {
        // silently stays as text tile
      } finally {
        setGenerating(false);
      }
    }, generateDelay);

    return () => clearTimeout(timer);
  }, [hasRealImage]);

  const displayUrl = hasRealImage ? proxyUrl(item.image_url) : aiUrl;
  const isAi = !hasRealImage && !!aiUrl;

  if (!displayUrl) {
    return <TextTile item={item} shimmer={generating} />;
  }

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.imageTile}>
      <div className={styles.imageContainer}>
        <img
          src={displayUrl}
          alt={item.title}
          className={styles.image}
          loading="lazy"
          onError={() => { if (hasRealImage) setImgError(true); }}
        />
        {isAi && <span className={styles.aiBadge}>✦</span>}
      </div>
      <div className={styles.imageBody}>
        <p className={styles.imageTitle}>{item.title}</p>
        {item.board_or_collection && (
          <span className={styles.collection}>{item.board_or_collection}</span>
        )}
      </div>
    </a>
  );
}

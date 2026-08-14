import type { ChatRequest, Item, SyncResponse } from "@/types/gift-app";

const BASE = process.env.NEXT_PUBLIC_GIFT_APP_API ?? "http://localhost:8000/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchItems(params?: {
  source?: string;
  category?: string;
  top?: number;
  skip?: number;
}): Promise<Item[]> {
  const search = new URLSearchParams();
  if (params?.source) search.set("source", params.source);
  if (params?.category) search.set("category", params.category);
  if (params?.top !== undefined) search.set("top", String(params.top));
  if (params?.skip !== undefined) search.set("skip", String(params.skip));
  const res = await fetch(`${BASE}/items?${search}`);
  return handleResponse<Item[]>(res);
}

export async function streamChat(
  request: ChatRequest,
  onStatus: (text: string) => void,
  onToken: (text: string) => void,
  onDone: (sources: Item[]) => void,
): Promise<void> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      const data = JSON.parse(line.slice(6));
      if (data.type === "status") onStatus(data.text);
      else if (data.type === "token") onToken(data.text);
      else if (data.type === "done") onDone(data.sources as Item[]);
      else if (data.type === "error") throw new Error(data.text);
    }
  }
}

export async function syncRaindrop(): Promise<SyncResponse> {
  const res = await fetch(`${BASE}/sync/raindrop`, { method: "POST" });
  return handleResponse<SyncResponse>(res);
}

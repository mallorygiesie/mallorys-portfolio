export type Source = "raindrop" | "pinterest";
export type Category = "beauty" | "fashion" | "home" | "kitchen" | "other";

export interface Item {
  id: string;
  source: Source;
  title: string;
  description: string;
  url: string;
  image_url: string;
  board_or_collection: string;
  category: Category;
  tags: string[];
  style_keywords: string[];
  colors: string[];
  materials: string[];
  summary: string;
  saved_at: string | null;
  score?: number;
}

export interface CandidateItem {
  title: string;
  description?: string;
}

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  question: string;
  candidate_item?: CandidateItem;
  history?: HistoryMessage[];
}

export interface ChatResponse {
  answer: string;
  sources: Item[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Item[];
}

export interface SyncResponse {
  synced: number;
  message: string;
}

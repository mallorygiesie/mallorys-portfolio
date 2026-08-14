"use client";

import { useRef, useState } from "react";
import { streamChat } from "@/lib/gift-app/client";
import type { ChatMessage, HistoryMessage } from "@/types/gift-app";
import ChatMessageBubble from "./ChatMessage";
import styles from "./ChatBot.module.css";

const SUGGESTIONS = [
  "What should I get Mallory?",
  "Would Mallory like a ceramic lamp?",
  "Recommend a face wash Mallory wants",
  "What kind of jewelry does Mallory like?",
  "What home decor style does Mallory prefer?",
];

const MESSAGE_LIMIT = 5;

const BIRTHDAY_MESSAGES = [
  "okay real talk, you've asked five questions and mallory is paying for every single one of these API calls. it's her birthday. just call her. she'll read you the entire list. 🎂📞",
  "hi!! mallory here. you've been very thorough. i appreciate it. but also i'm being charged per token and it adds up. give me a call and i'll tell you exactly what i want. probably the ceramic thing. 🕯️",
  "fun fact: this RAG system costs money to run and it's mallory's birthday month. the most thoughtful gift you could give right now is hanging up and dialing her number. she will answer. 🎀",
];

export default function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const historyRef = useRef<HTMLDivElement>(null);

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  function scrollHistory() {
    const el = historyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  async function submit(question: string) {
    if (!question.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: question };

    if (userMessageCount >= MESSAGE_LIMIT) {
      const birthdayMsg: ChatMessage = {
        role: "assistant",
        content: BIRTHDAY_MESSAGES[Math.min(
          Math.floor((userMessageCount - MESSAGE_LIMIT) / 2),
          BIRTHDAY_MESSAGES.length - 1
        )],
      };
      setMessages((prev) => [...prev, userMsg, birthdayMsg]);
      setInput("");
      setTimeout(scrollHistory, 50);
      return;
    }

    const history: HistoryMessage[] = messages
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim())
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    setStatusText("");

    try {
      await streamChat(
        { question, history },
        (text) => {
          setStatusText(text);
          setTimeout(scrollHistory, 0);
        },
        (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + token };
            return updated;
          });
          setTimeout(scrollHistory, 0);
        },
        (sources) => {
          setStatusText("");
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], sources };
            return updated;
          });
        },
      );
    } catch (err) {
      setMessages((prev) => {
        const withoutPlaceholder = prev.slice(0, -1);
        return [...withoutPlaceholder, {
          role: "assistant",
          content: `Sorry, something went wrong: ${err instanceof Error ? err.message : "unknown error"}`,
        }];
      });
    } finally {
      setLoading(false);
      setStatusText("");
      setTimeout(scrollHistory, 50);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.history} ref={historyRef}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Ask about Mallory&apos;s taste</p>
            <p className={styles.emptySubtitle}>
              Powered by her Raindrop saves. Grounded answers only.
            </p>
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className={styles.suggestion} onClick={() => submit(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div className={styles.thinking}>
            {statusText ? (
              <span className={styles.statusText}>{statusText}</span>
            ) : (
              <>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </>
            )}
          </div>
        )}
      </div>

      <form
        className={styles.inputRow}
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about Mallory's taste…"
          disabled={loading}
        />
        <button className={styles.sendBtn} type="submit" disabled={!input.trim() || loading}>
          Send
        </button>
      </form>
    </div>
  );
}

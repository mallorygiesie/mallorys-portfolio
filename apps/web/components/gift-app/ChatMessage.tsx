"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/types/gift-app";
import styles from "./ChatMessage.module.css";

interface Props {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`${styles.wrapper} ${isUser ? styles.user : styles.assistant}`}>
      <div className={styles.bubble}>
        {isUser ? (
          <p className={styles.text}>{message.content}</p>
        ) : (
          <div className={styles.markdown}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {!isUser && message.sources && message.sources.length > 0 && (
        <div className={styles.sources}>
          <p className={styles.sourcesLabel}>Sources</p>
          <div className={styles.sourceList}>
            {message.sources.slice(0, 5).map((src) => (
              <a
                key={src.id}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.source}
                data-source={src.source}
              >
                {src.image_url && (
                  <img
                    src={`${process.env.NEXT_PUBLIC_GIFT_APP_API ?? "http://localhost:8000/api"}/proxy/image?url=${encodeURIComponent(src.image_url)}`}
                    alt={src.title}
                    className={styles.sourceImg}
                  />
                )}
                <span className={styles.sourceTitle}>{src.title}</span>
                <span className={styles.sourceTag}>{src.source}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import ChatbotIcon from "./ChatbotIcon";
import { renderMarkdown } from "../utils/renderMarkdown";

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ChatMessage = ({ chat, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const isUser = chat.role === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(chat.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={`message ${isUser ? "user-message" : "bot-message"}`}>
      {!isUser && <ChatbotIcon />}
      <div className="bubble-wrap">
        <div className={`message-text ${chat.error ? "error" : ""}`}>
          {isUser ? <p>{chat.text}</p> : renderMarkdown(chat.text)}
        </div>
        <div className="meta">
          <span>{formatTime(chat.time)}</span>
          {!isUser && !chat.error && (
            <button
              type="button"
              className="meta-btn material-symbols-outlined"
              onClick={copy}
              aria-label="Copy reply"
              title="Copy"
            >
              {copied ? "check" : "content_copy"}
            </button>
          )}
          {chat.error && onRetry && (
            <button type="button" className="meta-btn retry" onClick={onRetry}>
              <span className="material-symbols-outlined">refresh</span> Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

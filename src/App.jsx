
import { useCallback, useEffect, useRef, useState } from "react";
import ChatbotIcon from "./components/ChatbotIcon";
import ChatForm from "./components/ChatForm";
import ChatMessage from "./components/ChatMessage";
import TypingIndicator from "./components/TypingIndicator";
import Suggestions from "./components/Suggestions";

const STORAGE_KEY = "ev-assist:chat";
const THEME_KEY = "ev-assist:theme";

// Model comes from .env (VITE_MODEL_NAME); falls back to a valid model
const MODEL_NAME = import.meta.env.VITE_MODEL_NAME || "gemini-2.5-flash";

const SYSTEM_PROMPT =
  "You are EV IntelliAssist, a friendly expert on electric vehicles (charging, range, batteries, costs, maintenance, models, incentives). Keep answers clear and concise, use short lists where helpful, and politely steer off-topic questions back to EVs.";

const safeLoad = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const App = () => {
  const [messages, setMessages] = useState(() =>
    safeLoad(STORAGE_KEY, [])
  );

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);

  const [theme, setTheme] = useState(() => {
    const saved = safeLoad(THEME_KEY, null);

    if (saved) return saved;

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bodyRef = useRef(null);
  const abortRef = useRef(null);

  // Persist chat messages
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-60))
      );
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  // Persist theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = bodyRef.current;

    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, open, scrollToBottom]);

  const onScroll = () => {
    const el = bodyRef.current;

    if (!el) return;

    setShowScrollBtn(
      el.scrollHeight - el.scrollTop - el.clientHeight > 120
    );
  };

  // Gemini API request
  const requestReply = useCallback(async (history) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "model",
          text: "API key is missing. Please check your .env file.",
          time: Date.now(),
          error: true,
        },
      ]);
      return;
    }

    setLoading(true);

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    // Prepare conversation history
    const contents = history
      .filter((m) => !m.error)
      .map((m, i) => ({
        role: m.role,
        parts: [
          {
            text:
              i === 0
                ? m.text
                : m.text,
          },
        ],
      }));

    // Updated Gemini API endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error?.message || `API Error: ${res.status}`
        );
      }

      const reply =
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || "")
          .join("")
          .trim() ||
        "Sorry, I didn't get that. Could you rephrase?";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "model",
          text: reply,
          time: Date.now(),
        },
      ]);
    } catch (err) {
      if (err.name === "AbortError") return;

      console.error("Gemini API Error:", err);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "model",
          text: `Sorry, I couldn't reach the assistant. ${err.message || "Check your connection and try again."}`,
          time: Date.now(),
          error: true,
        },
      ]);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  // Send user message
  const sendMessage = useCallback(
    (text) => {
      const userMsg = {
        id: crypto.randomUUID(),
        role: "user",
        text,
        time: Date.now(),
      };

      const next = [
        ...messages.filter((m) => !m.error),
        userMsg,
      ];

      setMessages(next);
      requestReply(next);
    },
    [messages, requestReply]
  );

  // Retry failed message
  const retry = () => {
    const clean = messages.filter((m) => !m.error);

    setMessages(clean);

    if (clean.length) {
      requestReply(clean);
    }
  };

  // Clear conversation
  const clearChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;

    setLoading(false);
    setMessages([]);
  };

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        className={`launcher ${open ? "hidden" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Open EV assistant"
      >
        <ChatbotIcon />
        {messages.length > 0 && (
          <span className="launcher-dot" />
        )}
      </button>

      <main
        className={`chatbot-popup ${open ? "open" : "closed"}`}
        aria-hidden={!open}
      >
        {/* Header */}
        <header className="chat-header">
          <div className="header-info">
            <ChatbotIcon />

            <div>
              <h1 className="logo-text">EV IntelliAssist</h1>
              <p className="status">
                <span className="dot" /> Online
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="material-symbols-outlined"
              onClick={() =>
                setTheme((t) =>
                  t === "dark" ? "light" : "dark"
                )
              }
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </button>

            <button
              type="button"
              className="material-symbols-outlined"
              onClick={clearChat}
              disabled={!messages.length}
              aria-label="Clear conversation"
              title="Clear chat"
            >
              delete
            </button>

            <button
              type="button"
              className="material-symbols-outlined"
              onClick={() => setOpen(false)}
              aria-label="Minimize chat"
              title="Minimize"
            >
              keyboard_arrow_down
            </button>
          </div>
        </header>

        {/* Chat Body */}
        <div
          ref={bodyRef}
          onScroll={onScroll}
          className="chat-body"
          aria-live="polite"
        >
          <div className="message bot-message">
            <ChatbotIcon />

            <div className="bubble-wrap">
              <div className="message-text">
                <p>Hey there! 👋</p>
                <p>
                  I’m your EV assistant. Ask me about charging,
                  range, batteries or costs.
                </p>
              </div>
            </div>
          </div>

          {messages.length === 0 && (
            <Suggestions
              onPick={sendMessage}
              disabled={loading}
            />
          )}

          {messages.map((chat, i) => (
            <ChatMessage
              key={chat.id}
              chat={chat}
              onRetry={
                chat.error && i === messages.length - 1
                  ? retry
                  : undefined
              }
            />
          ))}

          {loading && <TypingIndicator />}
        </div>

        {/* Scroll Button */}
        {showScrollBtn && (
          <button
            type="button"
            className="scroll-btn material-symbols-outlined"
            onClick={() => scrollToBottom()}
            aria-label="Scroll to latest message"
          >
            arrow_downward
          </button>
        )}

        {/* Footer */}
        <footer className="chat-footer">
          <ChatForm
            onSend={sendMessage}
            loading={loading}
          />

          <p className="disclaimer">
            AI can make mistakes. Verify important details.
          </p>
        </footer>
      </main>
    </>
  );
};

export default App;

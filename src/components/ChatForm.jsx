import { useEffect, useRef, useState } from "react";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const ChatForm = ({ onSend, loading }) => {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const recogRef = useRef(null);

  // Auto-grow textarea up to ~5 lines
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);

  const submit = (e) => {
    e?.preventDefault();
    const text = value.trim();
    if (!text || loading) return;
    onSend(text);
    setValue("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const toggleMic = () => {
    if (!SpeechRecognition) return;
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const r = new SpeechRecognition();
    r.lang = navigator.language || "en-US";
    r.interimResults = true;
    r.onresult = (ev) => {
      const t = Array.from(ev.results).map((x) => x[0].transcript).join("");
      setValue(t);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  return (
    <form className="chat-form" onSubmit={submit}>
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={listening ? "Listening…" : "Ask about EVs…"}
        className="message-input"
        aria-label="Message"
        enterKeyHint="send"
      />
      {SpeechRecognition && (
        <button
          type="button"
          className={`icon-btn mic material-symbols-outlined ${listening ? "active" : ""}`}
          onClick={toggleMic}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
        >
          {listening ? "mic_off" : "mic"}
        </button>
      )}
      <button
        type="submit"
        className="icon-btn send material-symbols-outlined"
        disabled={!value.trim() || loading}
        aria-label="Send message"
      >
        arrow_upward
      </button>
    </form>
  );
};

export default ChatForm;

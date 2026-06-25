import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { X, Send } from "lucide-react";
import BrandLogo from "./BrandLogo";
import SourceBadge from "./SourceBadge";

const suggested = [
  "Where should we invest first?",
  "Is this real data?",
  "How is the Opportunity Score calculated?",
  "Which parishes have sample metrics?"
];

const FIRST_MESSAGE = {
  role: "assistant",
  text: "Hi. I can help you explore parish priority, scoring, and data coverage. Answers cite public sources or model estimates where applicable.",
  sources: []
};

function FloatingAssistant() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([FIRST_MESSAGE]);
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  if (pathname === "/platform") return null;

  const send = async (text) => {
    const message = text || input.trim();
    if (!message) return;
    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, selectedParishId: null, history })
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", text: data.error || `Request failed (${res.status})`, sources: [] }]);
        return;
      }
      const sources = Array.isArray(data.sources) ? data.sources : [];
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer, sources, confidence: data.confidence }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Could not reach the server. Please try again.", sources: [] }]);
    } finally {
      setLoading(false);
    }
  };

  const panelTransition = { type: "spring", stiffness: 440, damping: 34, mass: 0.85 };

  return (
    <div className="floating-assistant-root" aria-live="polite">
      <AnimatePresence>
        {open ? (
          <motion.button
            type="button"
            key="fab-backdrop"
            className="floating-assistant-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            aria-label="Close assistant"
            onClick={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>
      <div className="floating-assistant-stack">
        <AnimatePresence>
          {open ? (
            <motion.div
              key="fab-panel"
              id="floating-assistant-panel"
              className="floating-assistant-panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigator assistant chat"
              initial={{ opacity: 0, y: 22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={panelTransition}
            >
              <header className="floating-assistant-head">
                <div>
                  <p className="floating-assistant-title">
                    <span className="floating-assistant-title-row">
                      <BrandLogo variant="panel-title" alt="" aria-hidden />
                      <span>Navigator Assistant</span>
                    </span>
                  </p>
                  <p className="floating-assistant-sub">Grounded answers about parishes, scoring, and data status.</p>
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="floating-assistant-iconbtn"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                >
                  <X size={18} />
                </button>
              </header>
              <div className="floating-assistant-chips">
                {suggested.map((q) => (
                  <button key={q} type="button" className="floating-chip" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <div className="floating-assistant-messages">
                {messages.map((m, i) => (
                  <div key={`${m.role}-${i}`} className={`floating-bubble-wrap floating-bubble-wrap-${m.role}`}>
                    <div className={`floating-bubble floating-bubble-${m.role}`}>{m.text}</div>
                    {m.role === "assistant" && m.sources?.length > 0 ? (
                      <div className="floating-source-chips">
                        {m.sources.slice(0, 4).map((s) => (
                          <SourceBadge
                            key={s}
                            type={/public|LDOE|Census|LWC/i.test(s) ? "public" : /model/i.test(s) ? "model" : "demo"}
                            label={s}
                          />
                        ))}
                      </div>
                    ) : null}
                    {m.role === "assistant" && m.confidence ? (
                      <span className="floating-confidence tiny muted">{m.confidence} confidence</span>
                    ) : null}
                  </div>
                ))}
                {loading ? (
                  <div className="floating-bubble floating-bubble-assistant floating-loading" aria-busy="true">
                    <span className="floating-dots" aria-hidden>
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className="floating-loading-label">Thinking</span>
                  </div>
                ) : null}
              </div>
              <form
                className="floating-assistant-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <label htmlFor="floating-assistant-input" className="sr-only">
                  Message
                </label>
                <input
                  id="floating-assistant-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about parishes or data"
                  autoComplete="off"
                />
                <button type="submit" className="floating-assistant-send" disabled={loading} aria-label="Send message">
                  <Send size={18} />
                </button>
              </form>
              <p className="floating-assistant-foot">
                Answers use public-source references and model estimates in the sample. Not official LDOE guidance.
                <span aria-hidden> · </span>
                <Link to="/data-sources">Data sources</Link>
                <span aria-hidden> · </span>
                <Link to="/methodology">Methodology</Link>
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          className="floating-assistant-launcher floating-assistant-launcher--pill"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={open ? "floating-assistant-panel" : undefined}
          aria-label={open ? "Close Navigator assistant" : "Open Navigator assistant"}
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        >
          <span className="floating-assistant-launcher-inner">
            <BrandLogo variant="launcher" alt="" aria-hidden />
          </span>
          <span className="floating-assistant-launcher-copy">
            <span className="floating-assistant-launcher-hey">Need help?</span>
            <span className="floating-assistant-launcher-label">Ask Navigator</span>
          </span>
        </motion.button>
      </div>
    </div>
  );
}

export default FloatingAssistant;

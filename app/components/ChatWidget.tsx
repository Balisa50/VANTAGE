"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget({ articleBody }: { articleBody: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const maxMessages = 8;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || messages.length >= maxMessages) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          articleBody,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantText,
            };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-6">
        Ask Vantage
      </h3>

      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        {messages.length > 0 && (
          <div className="max-h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${
                  msg.role === "user" ? "text-text-primary" : "text-text-secondary font-mono text-sm"
                }`}
              >
                <span className="text-xs text-accent-amber font-mono uppercase mr-2">
                  {msg.role === "user" ? "You" : "Vantage"}
                </span>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                  {msg.content.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s/gm, "").replace(/^-\s/gm, "").replace(/\s*[—–]\s*/g, ", ")}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="border-t border-border p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={
              messages.length >= maxMessages
                ? "Session limit reached"
                : "Ask about this story..."
            }
            disabled={messages.length >= maxMessages || loading}
            className="flex-1 bg-transparent text-text-primary placeholder-text-secondary text-sm outline-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || messages.length >= maxMessages}
            className="px-4 py-1.5 bg-accent-amber text-background text-sm font-mono rounded hover:bg-accent-amber/90 transition-colors disabled:opacity-30"
          >
            {loading ? "..." : "Ask"}
          </button>
        </div>
      </div>

      {messages.length > 0 && messages.length < maxMessages && (
        <p className="text-xs text-text-secondary mt-2 font-mono">
          {maxMessages - messages.length} messages remaining
        </p>
      )}
    </section>
  );
}

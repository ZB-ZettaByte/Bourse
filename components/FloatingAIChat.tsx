"use client";

import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
};

const starterMessages = [
  "What stocks are trending today?",
  "Explain P/E ratio simply",
  "Is NVDA a good buy right now?",
];

export default function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function sendMessage(nextMessage: string) {
    const content = nextMessage.trim();
    if (!content || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          message: content,
          history: messages.slice(-6),
        }),
      });
      const payload = (await response.json()) as { reply?: string; error?: string };
      const reply = payload.reply?.trim() || payload.error || "Bourse AI is unavailable right now.";
      setMessages([...nextMessages, { role: "assistant", content: reply, isTyping: true }]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Bourse AI is unavailable right now.", isTyping: true }]);
    } finally {
      setIsSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Bourse AI chat"
        className="fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-full bg-[#22c55e] text-black shadow-2xl shadow-black/35 transition hover:scale-105 hover:bg-[#2ee66f] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/60 focus:ring-offset-2 focus:ring-offset-black"
      >
        <Sparkles className="size-6" />
      </button>

      <section
        aria-label="Bourse AI chat panel"
        className={`fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] max-h-[calc(100vh-3rem)] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/95 text-white shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-300 ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
        }`}
        style={{ boxShadow: "0 0 20px rgba(34,197,94,0.15), 0 24px 60px rgba(0,0,0,0.5)" }}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#22c55e] text-black">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold leading-none">Bourse AI</h2>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/45">
                <span className="size-2 rounded-full bg-[#22c55e]" />
                Online
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close Bourse AI chat"
            className="grid size-8 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AIAvatar />
                <p className="max-w-[82%] rounded-[4px_18px_18px_18px] border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-sm leading-6 text-white/75">
                  <span className="mb-2 grid size-6 place-items-center rounded-full bg-[#22c55e] text-black">
                    <Sparkles className="size-3.5" />
                  </span>
                  Hi, I&apos;m Bourse AI. Ask me about markets, metrics, or stock trends.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pl-11">
                {starterMessages.map((message) => (
                  <button
                    key={message}
                    type="button"
                    onClick={() => void sendMessage(message)}
                    className="rounded-full border border-[#22c55e] bg-transparent px-3.5 py-2 text-left text-xs font-semibold leading-5 text-[#22c55e] transition hover:bg-[#22c55e] hover:text-black"
                  >
                    {message}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && <AIAvatar />}
                  <p
                    className={`max-w-[82%] whitespace-pre-wrap px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "rounded-[18px_18px_4px_18px] bg-[#22c55e] font-bold text-white"
                        : "rounded-[4px_18px_18px_18px] border border-[#2a2a2a] bg-[#1a1a1a] text-white/75"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <span className="mb-2 grid size-6 place-items-center rounded-full bg-[#22c55e] text-black">
                        <Sparkles className="size-3.5" />
                      </span>
                    )}
                    <FormattedMessage
                      content={message.content}
                      animate={message.role === "assistant" && message.isTyping}
                      onDone={() => {
                        setMessages((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, isTyping: false } : item
                          )
                        );
                      }}
                    />
                  </p>
                </div>
              ))}
              {isSending && (
                <div className="flex items-start gap-3">
                  <AIAvatar />
                  <div className="flex items-center gap-1 rounded-[4px_18px_18px_18px] border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3">
                    <span className="size-1.5 animate-bounce rounded-full bg-white/45" />
                    <span className="size-1.5 animate-bounce rounded-full bg-white/45 [animation-delay:120ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-white/45 [animation-delay:240ms]" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 p-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about stocks..."
            className="h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/35 focus:border-[#22c55e]/60 focus:shadow-[0_0_0_2px_rgba(34,197,94,0.3)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Send message"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[#22c55e] text-black transition hover:scale-105 hover:bg-[#2ee66f] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
          >
            <Send className="size-4" />
          </button>
        </form>
      </section>
    </>
  );
}

function AIAvatar() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-white">
      <MessageCircle className="size-4" />
    </span>
  );
}

function FormattedMessage({
  content,
  animate = false,
  onDone,
}: {
  content: string;
  animate?: boolean;
  onDone?: () => void;
}) {
  const [visibleLength, setVisibleLength] = useState(animate ? 0 : content.length);
  const visibleContent = animate ? content.slice(0, visibleLength) : content;

  useEffect(() => {
    if (!animate) {
      setVisibleLength(content.length);
      return;
    }

    setVisibleLength(0);
    let nextLength = 0;
    const intervalId = window.setInterval(() => {
      nextLength = Math.min(content.length, nextLength + 2);
      setVisibleLength(nextLength);
      if (nextLength >= content.length) {
        window.clearInterval(intervalId);
        onDone?.();
      }
    }, 18);

    return () => window.clearInterval(intervalId);
  }, [animate, content, onDone]);

  return (
    <>
      {visibleContent.split("\n").map((line, index) => (
        <span key={`${line}-${index}`} className="block">
          {line.trimStart().startsWith("- ") ? (
            <span className="flex gap-2">
              <span aria-hidden className="mt-[0.6em] size-1 shrink-0 rounded-full bg-current" />
              <span>{formatInlineMarkdown(line.trimStart().slice(2))}</span>
            </span>
          ) : (
            formatInlineMarkdown(line)
          )}
        </span>
      ))}
    </>
  );
}

function formatInlineMarkdown(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

"use client";

import Image from "next/image";
import { Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
  type?: "comparison";
  text?: string;
  stocks?: ComparisonStock[];
};

type ComparisonStock = {
  ticker: string;
  price: number;
  change: number;
  candles: number[];
  times?: number[];
};

type ChatPayload = {
  reply?: string;
  error?: string;
  type?: "comparison";
  text?: string;
  stocks?: ComparisonStock[];
};

const starterMessages = [
  "What stocks are trending today?",
  "Explain P/E ratio simply",
  "Is NVDA a good buy right now?",
];
const offlineReply =
  "Bourse AI is currently offline. The backend service is not running to reduce hosting costs. For a live demo, please check the project README for instructions to run locally.";
const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const bourseIconSrc = `${publicBasePath}/bourse-icon.svg`;
const isStaticDeployment = Boolean(process.env.NEXT_PUBLIC_BASE_PATH);

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

    if (isStaticDeployment) {
      window.setTimeout(() => {
        setMessages([...nextMessages, { role: "assistant", content: offlineReply, isTyping: true }]);
        setIsSending(false);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }, 500);
      return;
    }

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
      const payload = (await response.json()) as ChatPayload;

      if (payload.type === "comparison" && payload.text && Array.isArray(payload.stocks)) {
        setMessages([
          ...nextMessages,
          {
            role: "assistant",
            content: payload.text,
            text: payload.text,
            type: "comparison",
            stocks: payload.stocks,
            isTyping: false,
          },
        ]);
      } else {
        const reply = payload.reply?.trim() || payload.error || offlineReply;
        setMessages([...nextMessages, { role: "assistant", content: reply, isTyping: true }]);
      }
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: offlineReply, isTyping: true }]);
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
        <Image src={bourseIconSrc} alt="Bourse AI" width={36} height={36} className="size-9 rounded-full" />
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
            <span className="grid size-10 place-items-center rounded-full bg-green-900 p-0.5 ring-1 ring-emerald-300/35">
              <Image
                src={bourseIconSrc}
                alt="Bourse AI"
                width={36}
                height={36}
                className="size-9 rounded-full"
              />
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
                  <ChatBubble
                    message={message}
                    onDone={() => {
                      setMessages((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, isTyping: false } : item
                        )
                      );
                    }}
                  />
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
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-green-900 p-0.5 ring-1 ring-emerald-300/35">
      <Image src={bourseIconSrc} alt="Bourse AI" width={28} height={28} className="size-7 rounded-full" />
    </span>
  );
}

function ChatBubble({ message, onDone }: { message: ChatMessage; onDone: () => void }) {
  if (message.role === "user") {
    return (
      <div className="max-w-[82%] whitespace-pre-wrap rounded-[18px_18px_4px_18px] bg-[#22c55e] px-4 py-3 text-sm font-bold leading-6 text-white">
        <FormattedMessage content={message.content} />
      </div>
    );
  }

  return (
    <div className="max-w-[82%] whitespace-pre-wrap rounded-[4px_18px_18px_18px] border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-sm leading-6 text-white/75">
      {message.type === "comparison" && message.stocks?.length === 2 ? (
        <ComparisonMessage text={message.text ?? message.content} stocks={message.stocks} />
      ) : (
        <FormattedMessage content={message.content} animate={message.isTyping} onDone={onDone} />
      )}
    </div>
  );
}

function ComparisonMessage({ text, stocks }: { text: string; stocks: ComparisonStock[] }) {
  const [left, right] = stocks;
  const hasCandleData = left.candles.length >= 4 && right.candles.length >= 4;
  const pointCount = Math.max(left.candles.length, right.candles.length);
  const chartData = Array.from({ length: pointCount }).map((_, index) => ({
    i: index,
    time: comparisonTimeLabel(
      interpolatedTimestamp(left.times, index, pointCount) ??
        interpolatedTimestamp(right.times, index, pointCount)
    ),
    [left.ticker]: priceAt(left.candles, index, pointCount),
    [right.ticker]: priceAt(right.candles, index, pointCount),
  }));
  const leftColor = "#22c55e";
  const rightColor = "#60a5fa";

  return (
    <div className="space-y-3">
      <p>{text}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-white/40">
          {left.ticker} vs {right.ticker} — Today
        </p>
        <div className="flex items-center gap-3 text-[11px] font-bold text-white/45">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#22c55e]" />
            {left.ticker}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#60a5fa]" />
            {right.ticker}
          </span>
        </div>
      </div>
      <div className="h-52 w-full overflow-hidden rounded-lg border border-white/10 bg-black/30 p-2 shadow-inner shadow-black/30">
        {hasCandleData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 0, right: 6, top: 10, bottom: 6 }}>
              <defs>
                <linearGradient id={`comparisonFill-${left.ticker}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={leftColor} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={leftColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`comparisonFill-${right.ticker}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={rightColor} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={rightColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="i"
                axisLine={false}
                tickLine={false}
                ticks={[0, 18, 39, 60, 78].filter((tick) => tick < pointCount)}
                tickFormatter={(value) => chartData[Number(value)]?.time ?? ""}
                minTickGap={18}
                tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 700 }}
              />
              <YAxis yAxisId="left" hide domain={["dataMin", "dataMax"]} />
              <YAxis yAxisId="right" hide orientation="right" domain={["dataMin", "dataMax"]} />
              <ReferenceLine
                yAxisId="left"
                y={left.candles[0] ?? left.price}
                stroke="rgba(34,197,94,0.24)"
                strokeDasharray="4 4"
              />
              <ReferenceLine
                yAxisId="right"
                y={right.candles[0] ?? right.price}
                stroke="rgba(96,165,250,0.22)"
                strokeDasharray="4 4"
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  color: "#fff",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.55)" }}
                formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
              />
              <Area
                type="monotone"
                dataKey={left.ticker}
                yAxisId="left"
                stroke={leftColor}
                strokeWidth={3}
                fill={`url(#comparisonFill-${left.ticker})`}
                dot={false}
                activeDot={{ r: 4, fill: leftColor, stroke: "#111", strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey={right.ticker}
                yAxisId="right"
                stroke={rightColor}
                strokeWidth={3}
                fill={`url(#comparisonFill-${right.ticker})`}
                dot={false}
                activeDot={{ r: 4, fill: rightColor, stroke: "#111", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center px-5 text-center text-xs font-semibold leading-5 text-white/45">
            Real 5-minute candle data is unavailable for this comparison right now.
          </div>
        )}
      </div>
      <div className="flex gap-3">
        {stocks.map((stock) => {
          const isUp = stock.change >= 0;
          return (
            <div key={stock.ticker} className="w-1/2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-bold text-white/45">{stock.ticker}</p>
              <p className="mt-1 text-base font-bold text-white">${stock.price.toFixed(2)}</p>
              <p className={`mt-1 text-xs font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
                {isUp ? "+" : ""}
                {stock.change.toFixed(2)}% {isUp ? "▲" : "▼"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function priceAt(candles: number[], index: number, pointCount: number) {
  const valid = candles.filter((value) => Number.isFinite(value) && value > 0);
  if (valid.length === 0) return 0;
  const first = valid[0];
  if (valid.length === 1 || pointCount <= 1) return first;
  const position = (index / (pointCount - 1)) * (valid.length - 1);
  const lower = Math.floor(position);
  const upper = Math.min(valid.length - 1, Math.ceil(position));
  const ratio = position - lower;
  return valid[lower] + (valid[upper] - valid[lower]) * ratio;
}

function interpolatedTimestamp(times: number[] | undefined, index: number, pointCount: number) {
  const valid = times?.filter((value) => Number.isFinite(value) && value > 0) ?? [];
  if (valid.length >= pointCount) return valid[index];
  return undefined;
}

function comparisonTimeLabel(timestamp: number | undefined) {
  if (typeof timestamp === "number" && Number.isFinite(timestamp)) {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(
      new Date(timestamp * 1000)
    );
  }
  return "";
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
      return (
        <strong key={`${part}-${index}`} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

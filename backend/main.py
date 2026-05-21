import os
import re
import asyncio
from contextlib import asynccontextmanager
from typing import Any
from urllib.parse import quote

import faiss
import httpx
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer


def load_local_env() -> None:
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if not os.path.exists(env_path):
        return

    with open(env_path, encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_local_env()

FINNHUB_BASE_URL = os.getenv("FINNHUB_BASE_URL", "https://finnhub.io/api/v1")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY") or os.getenv("NEXT_PUBLIC_FINNHUB_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHAT_MARKET_SYMBOLS = ["AAPL", "TSLA", "NVDA", "AMD", "AMZN", "MSFT", "GOOGL", "SPY", "QQQ", "DIA", "IWM"]
CHAT_STOCK_INTENT_WORDS = {
    "stock",
    "stocks",
    "share",
    "shares",
    "price",
    "quote",
    "ticker",
    "trading",
    "market",
    "company",
    "worth",
    "buy",
    "sell",
}
CHAT_SEARCH_STOPWORDS = {
    "a",
    "about",
    "and",
    "any",
    "are",
    "can",
    "company",
    "compare",
    "could",
    "current",
    "currently",
    "difference",
    "does",
    "for",
    "give",
    "how",
    "i",
    "is",
    "it",
    "live",
    "look",
    "me",
    "much",
    "now",
    "of",
    "on",
    "please",
    "price",
    "quote",
    "right",
    "share",
    "shares",
    "best",
    "gainers",
    "list",
    "mover",
    "movers",
    "performance",
    "performing",
    "summary",
    "stock",
    "stocks",
    "tell",
    "that",
    "the",
    "this",
    "ticker",
    "today",
    "top",
    "trading",
    "trend",
    "trending",
    "up",
    "value",
    "versus",
    "vs",
    "what",
    "whats",
    "with",
    "worth",
}
CHAT_TICKER_SKIP_WORDS = {
    "AI",
    "ANY",
    "CEO",
    "CFO",
    "EPS",
    "ETF",
    "IPO",
    "LLC",
    "PE",
    "P",
    "SEC",
    "USD",
}
STOCK_NAMES = {
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corp.",
    "GOOGL": "Alphabet Inc.",
    "AMZN": "Amazon.com Inc.",
    "TSLA": "Tesla Inc.",
    "NVDA": "NVIDIA Corp.",
    "AMD": "Advanced Micro Devices",
    "SPY": "S&P 500 ETF",
    "QQQ": "Nasdaq 100 ETF",
    "DIA": "Dow Jones ETF",
    "IWM": "Russell 2000 ETF",
}


class SearchState:
    model: SentenceTransformer | None = None
    index: faiss.IndexFlatIP | None = None
    stocks: list[dict[str, str]] = []


state = SearchState()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


def clean_symbol(value: str) -> str:
    return re.sub(r"[^A-Z0-9.-]", "", value.strip().upper())


def groq_error_detail(error: httpx.HTTPStatusError, fallback: str) -> str:
    try:
        payload = error.response.json()
        message = payload.get("error", {}).get("message")
        return str(message or fallback)
    except Exception:
        return fallback


def format_chat_reply(content: str) -> str:
    reply = content.strip()
    reply = re.sub(r"^\s*#+\s*", "", reply, flags=re.MULTILINE)
    reply = re.sub(r"^\s*\*\s*(disclaimer|note)\s*:\s*", "", reply, flags=re.IGNORECASE | re.MULTILINE)
    reply = re.sub(r"\n{3,}", "\n\n", reply)
    lines = [line.rstrip() for line in reply.splitlines() if line.strip()]
    return "\n".join(lines[:6]).strip()


def clean_stock_query(value: str) -> str:
    query = re.sub(r"[$?!.:,;]", " ", value).strip()
    query = re.sub(
        r"\b(stock|stocks|share|shares|price|prices|quote|quotes|today|now|right now|performance|ticker|tickers)\b",
        " ",
        query,
        flags=re.IGNORECASE,
    )
    query = re.sub(r"\s+", " ", query).strip(" -")
    return query


def extract_comparison_queries(message: str) -> tuple[str, str] | None:
    patterns = [
        r"\bcompare\s+(.+?)\s+(?:and|with)\s+(.+)$",
        r"\bdifference\s+between\s+(.+?)\s+and\s+(.+)$",
        r"\b(.+?)\s+vs\.?\s+(.+)$",
        r"\b(.+?)\s+versus\s+(.+)$",
        r"\b([A-Za-z$][A-Za-z0-9$ .&'-]{0,40}?)\s+and\s+([A-Za-z$][A-Za-z0-9$ .&'-]{0,40}?)\s+stocks?\b",
    ]

    for pattern in patterns:
        match = re.search(pattern, message, flags=re.IGNORECASE)
        if not match:
            continue
        left = clean_stock_query(match.group(1))
        right = clean_stock_query(match.group(2))
        if left and right and left.lower() != right.lower():
            return left, right
    return None


def extract_live_data_from_history(history: list[dict[str, str]], queries: list[str]) -> str | None:
    if not queries:
        return None

    transcript = "\n".join(item["content"] for item in history)
    if not transcript:
        return None

    query_keys = {clean_symbol(query) for query in queries}
    query_words = {
        clean_stock_query(query).lower()
        for query in queries
        if len(clean_stock_query(query)) > 2
    }
    sentences = re.split(r"(?<=[.!?])\s+", transcript)
    for sentence in reversed(sentences):
        upper_sentence = sentence.upper()
        lower_sentence = sentence.lower()
        mentions_query = any(key and re.search(rf"\b{re.escape(key)}\b", upper_sentence) for key in query_keys)
        mentions_query = mentions_query or any(word and word in lower_sentence for word in query_words)
        has_price = bool(re.search(r"\$\d+(?:\.\d+)?", sentence))
        has_percent = bool(re.search(r"[+-]?\d+(?:\.\d+)?%", sentence))
        if mentions_query and has_price and has_percent:
            return f"Conversation memory live data: {sentence.strip()}"
    return None


async def fetch_live_stock_data(query: str) -> dict[str, Any] | None:
    resolved = await resolve_stock_symbol(query)
    if not resolved:
        return None

    quote_payload, profile = await asyncio.gather(
        fetch_finnhub(f"/quote?symbol={quote(resolved['symbol'])}"),
        fetch_finnhub(f"/stock/profile2?symbol={quote(resolved['symbol'])}"),
    )
    if not quote_has_live_price(quote_payload):
        return None

    price = float(quote_payload["c"])
    previous_close = float(quote_payload["pc"])
    change = quote_payload.get("d")
    if not isinstance(change, (int, float)):
        change = price - previous_close
    change_percent = quote_payload.get("dp")
    if not isinstance(change_percent, (int, float)):
        change_percent = (float(change) / previous_close) * 100

    company_name = resolved["name"]
    if isinstance(profile, dict):
        company_name = str(profile.get("name") or company_name).strip()

    return {
        "symbol": resolved["symbol"],
        "name": company_name,
        "price": price,
        "change": float(change),
        "change_percent": float(change_percent),
        "high": quote_payload.get("h"),
        "low": quote_payload.get("l"),
        "previous_close": previous_close,
    }


def format_live_stock_context(stock: dict[str, Any]) -> str:
    high = stock.get("high")
    low = stock.get("low")
    high_text = f"${float(high):.2f}" if isinstance(high, (int, float)) else "unavailable"
    low_text = f"${float(low):.2f}" if isinstance(low, (int, float)) else "unavailable"
    change_sign = "+" if stock["change"] >= 0 else ""
    percent_sign = "+" if stock["change_percent"] >= 0 else ""
    return (
        f"Live data for {stock['symbol']} — {stock['name']}: "
        f"Current price ${stock['price']:.2f}, Change {change_sign}{stock['change']:.2f} "
        f"({percent_sign}{stock['change_percent']:.2f}%), High {high_text}, Low {low_text}, "
        f"Prev close ${stock['previous_close']:.2f}."
    )


def comparison_label(raw_label: str, stock: dict[str, Any]) -> str:
    cleaned = clean_stock_query(raw_label)
    if not cleaned:
        return str(stock["symbol"])
    if clean_symbol(cleaned) == stock["symbol"]:
        return str(stock["symbol"])
    return " ".join(word.capitalize() if not word.isupper() else word for word in cleaned.split())


def format_comparison_reply(left: dict[str, Any], right: dict[str, Any], left_raw_label: str, right_raw_label: str) -> str:
    left_label = comparison_label(left_raw_label, left)
    right_label = comparison_label(right_raw_label, right)
    left_sign = "+" if left["change_percent"] >= 0 else ""
    right_sign = "+" if right["change_percent"] >= 0 else ""
    left_outperforming = left["change_percent"] >= right["change_percent"]
    leader = left_label if left_outperforming else right_label
    laggard = right_label if left_outperforming else left_label
    gap = abs(left["change_percent"] - right["change_percent"])
    return (
        f"{left_label} vs {right_label} today: {left_label} is at ${left['price']:.2f} "
        f"({left_sign}{left['change_percent']:.2f}%) and {right_label} is at ${right['price']:.2f} "
        f"({right_sign}{right['change_percent']:.2f}%). {leader} is slightly outperforming "
        f"{laggard} today with a {gap:.2f} percentage-point higher move."
    )


def user_is_asking_for_stock_data(message: str) -> bool:
    words = set(re.findall(r"[a-zA-Z]+", message.lower()))
    has_cashtag = bool(re.search(r"\$[A-Za-z][A-Za-z0-9.-]{0,7}\b", message))
    has_upper_symbol = any(
        token not in CHAT_TICKER_SKIP_WORDS
        for token in re.findall(r"\b[A-Z]{2,5}(?:\.[A-Z])?\b", message)
    )
    return has_cashtag or has_upper_symbol or bool(words & CHAT_STOCK_INTENT_WORDS)


def build_stock_search_queries(message: str) -> list[str]:
    queries: list[str] = []

    for token in re.findall(r"\$([A-Za-z][A-Za-z0-9.-]{0,7})\b", message):
        symbol = clean_symbol(token)
        if symbol and symbol not in CHAT_TICKER_SKIP_WORDS:
            queries.append(symbol)

    for token in re.findall(r"\b[A-Z]{2,5}(?:\.[A-Z])?\b", message):
        symbol = clean_symbol(token)
        if symbol and symbol not in CHAT_TICKER_SKIP_WORDS:
            queries.append(symbol)

    words = re.findall(r"[A-Za-z][A-Za-z0-9&.'-]*", message.lower())
    company_words = [
        word.strip(".'-")
        for word in words
        if word.strip(".'-") and word.strip(".'-") not in CHAT_SEARCH_STOPWORDS
    ]
    if company_words:
        queries.append(" ".join(company_words[:6]))

    deduped: list[str] = []
    seen: set[str] = set()
    for query in queries:
        normalized = query.strip()
        key = normalized.lower()
        if normalized and key not in seen:
            deduped.append(normalized)
            seen.add(key)
    return deduped[:4]


def quote_has_live_price(quote_payload: Any) -> bool:
    if not isinstance(quote_payload, dict):
        return False
    price = quote_payload.get("c")
    previous_close = quote_payload.get("pc")
    return isinstance(price, (int, float)) and price > 0 and isinstance(previous_close, (int, float)) and previous_close > 0


async def resolve_stock_symbol(query: str) -> dict[str, str] | None:
    search_payload = await fetch_finnhub(f"/search?q={quote(query)}")
    results = search_payload.get("result", []) if isinstance(search_payload, dict) else []
    if not isinstance(results, list):
        return None

    clean_query = clean_symbol(query)
    preferred = []
    fallback = []
    for item in results:
        if not isinstance(item, dict):
            continue
        symbol = clean_symbol(str(item.get("symbol") or item.get("displaySymbol") or ""))
        if not symbol:
            continue
        description = str(item.get("description") or symbol).strip()
        result_type = str(item.get("type") or "").lower()
        stock = {"symbol": symbol, "name": description}
        if clean_query and symbol == clean_query:
            preferred.insert(0, stock)
        elif "common stock" in result_type or "equity" in result_type or "adr" in result_type:
            preferred.append(stock)
        else:
            fallback.append(stock)

    return (preferred or fallback or [None])[0]


async def fetch_requested_stock_context(message: str, history: list[dict[str, str]]) -> str | None:
    if not FINNHUB_API_KEY or not user_is_asking_for_stock_data(message):
        return None

    search_queries = build_stock_search_queries(message)
    if not search_queries:
        return None

    remembered = extract_live_data_from_history(history, search_queries)
    if remembered:
        return remembered

    for query in search_queries:
        try:
            stock = await fetch_live_stock_data(query)
        except Exception:
            continue

        if stock:
            return format_live_stock_context(stock)

    return "I couldn't find live data for that one — try searching it in Bourse using the search bar."


async def fetch_chat_quote(symbol: str) -> dict[str, Any] | None:
    try:
        quote = await fetch_finnhub(f"/quote?symbol={symbol}")
    except Exception:
        return None

    price = quote.get("c")
    previous_close = quote.get("pc")
    if not isinstance(price, (int, float)) or not isinstance(previous_close, (int, float)) or previous_close <= 0:
        return None

    change = quote.get("d") if isinstance(quote.get("d"), (int, float)) else price - previous_close
    change_percent = quote.get("dp") if isinstance(quote.get("dp"), (int, float)) else (change / previous_close) * 100
    return {
        "symbol": symbol,
        "name": STOCK_NAMES.get(symbol, symbol),
        "price": round(float(price), 2),
        "change": round(float(change), 2),
        "change_percent": round(float(change_percent), 2),
    }


async def build_chat_market_context() -> str:
    if not FINNHUB_API_KEY:
        return "Live market data is unavailable because FINNHUB_API_KEY is not configured."

    quotes = await asyncio.gather(*(fetch_chat_quote(symbol) for symbol in CHAT_MARKET_SYMBOLS))
    stocks = [quote for quote in quotes if quote]
    if not stocks:
        return "Live market data is unavailable because Finnhub returned no quotes."

    by_symbol = {stock["symbol"]: stock for stock in stocks}
    quote_parts = []
    for symbol in CHAT_MARKET_SYMBOLS:
        stock = by_symbol.get(symbol)
        if not stock:
            continue
        change_sign = "+" if stock["change"] >= 0 else ""
        sign = "+" if stock["change_percent"] >= 0 else ""
        quote_parts.append(
            f"{symbol} ({stock['name']}): ${stock['price']:.2f}, "
            f"{change_sign}${stock['change']:.2f} ({sign}{stock['change_percent']:.2f}%)"
        )

    return ", ".join(quote_parts)


async def fetch_finnhub(path: str) -> Any:
    if not FINNHUB_API_KEY:
        raise HTTPException(status_code=503, detail="FINNHUB_API_KEY is not configured.")

    separator = "&" if "?" in path else "?"
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        response = await client.get(f"{FINNHUB_BASE_URL}{path}{separator}token={FINNHUB_API_KEY}")
        response.raise_for_status()
        return response.json()


def normalize_embeddings(embeddings: np.ndarray) -> np.ndarray:
    vectors = embeddings.astype("float32")
    faiss.normalize_L2(vectors)
    return vectors


async def build_stock_index() -> None:
    symbols = await fetch_finnhub("/stock/symbol?exchange=US")
    stocks: list[dict[str, str]] = []

    for item in symbols:
        ticker = clean_symbol(str(item.get("symbol", "")))
        company_name = str(item.get("description") or item.get("displaySymbol") or ticker).strip()
        stock_type = str(item.get("type") or "").lower()
        if not ticker or not company_name:
            continue
        if stock_type and "stock" not in stock_type and "equity" not in stock_type and "adr" not in stock_type:
            continue
        stocks.append({"ticker": ticker, "companyName": company_name})

    model = SentenceTransformer(EMBEDDING_MODEL)
    texts = [f"{stock['ticker']} {stock['companyName']}" for stock in stocks]
    embeddings = normalize_embeddings(model.encode(texts, batch_size=128, show_progress_bar=False))
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    state.model = model
    state.index = index
    state.stocks = stocks


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await build_stock_index()
    except Exception:
        pass
    yield


app = FastAPI(title="Bourse Semantic Search", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/search")
async def search(q: str = Query(..., min_length=1)):
    if state.model is None or state.index is None or not state.stocks:
        raise HTTPException(status_code=503, detail="Semantic search index is still loading.")

    query_embedding = normalize_embeddings(state.model.encode([q]))
    scores, indexes = state.index.search(query_embedding, 8)
    results = []

    for score, index in zip(scores[0], indexes[0]):
        if index < 0 or index >= len(state.stocks):
            continue
        stock = state.stocks[index]
        results.append(
            {
                "ticker": stock["ticker"],
                "companyName": stock["companyName"],
                "score": float(score),
            }
        )

    return {"results": results}


@app.get("/api/insights")
async def insights(symbol: str = Query(..., min_length=1)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured.")

    ticker = clean_symbol(symbol)
    quote, profile, metrics = await fetch_insight_context(ticker)
    metric = metrics.get("metric", {}) if isinstance(metrics, dict) else {}
    context = {
        "company_name": profile.get("name") or ticker,
        "current_price": quote.get("c"),
        "change": quote.get("d"),
        "change_percent": quote.get("dp"),
        "volume": metric.get("10DayAverageTradingVolume") or metric.get("3MonthAverageTradingVolume"),
        "high": quote.get("h"),
        "low": quote.get("l"),
        "52_week_range": f"{metric.get('52WeekLow')} - {metric.get('52WeekHigh')}",
    }
    prompt = (
        "Return exactly 3 short investor insight bullets for this stock. "
        "Be concise, factual, and avoid investment advice. Use this context:\n"
        f"{context}"
    )

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a concise market analyst. Output only 3 bullets."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.35,
                "max_tokens": 180,
            },
        )
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as error:
            raise HTTPException(
                status_code=error.response.status_code,
                detail=groq_error_detail(error, "Groq insights request failed. Check GROQ_API_KEY and model access."),
            ) from error
        data = response.json()

    content = data["choices"][0]["message"]["content"]
    bullets = parse_three_bullets(content)
    return {"insights": bullets}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured.")

    user_message = request.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required.")

    history = [
        {"role": item.role, "content": item.content.strip()}
        for item in request.history[-6:]
        if item.role in {"user", "assistant"} and item.content.strip()
    ]
    comparison_queries = extract_comparison_queries(user_message)
    if comparison_queries:
        left_result, right_result = await asyncio.gather(
            fetch_live_stock_data(comparison_queries[0]),
            fetch_live_stock_data(comparison_queries[1]),
        )
        if left_result and right_result:
            return {"reply": format_comparison_reply(left_result, right_result, comparison_queries[0], comparison_queries[1])}
        if left_result or right_result:
            return {"reply": "I couldn't find live data for that one — try searching it in Bourse using the search bar."}

    market_context = await build_chat_market_context()
    requested_stock_context = await fetch_requested_stock_context(user_message, history)
    if requested_stock_context == "I couldn't find live data for that one — try searching it in Bourse using the search bar.":
        return {"reply": requested_stock_context}

    is_specific_stock_question = bool(requested_stock_context)
    if requested_stock_context:
        live_context = requested_stock_context
        response_scope = (
            "The user asked about one specific stock. Answer only about that stock. "
            "Do not mention any other stock, ticker, index, ETF, market mover, or broad tracked-market ranking. "
            "One stock question equals one stock answer. Only mention other stocks if the user explicitly asks to compare. "
            "Keep the answer to 2-3 sentences maximum. Do not include a separate market opener line. "
            "End with one brief human observation about that specific stock only, such as whether it is holding steady, slipping, or showing strength. "
        )
    else:
        live_context = f"Today's tracked market data: {market_context}"
        response_scope = (
            "Use the full tracked list when ranking, comparing, or answering what is trending. "
            "For stock list responses, use no more than 4 bullet lines, then end with one brief natural comment about the most interesting mover. "
        )
    opener_instruction = ""
    if not is_specific_stock_question:
        opener_instruction = (
            "Opening line must be simple and human, such as 'Lots of green today.', 'Strong tape today.', "
            "'Good day to be invested.', 'Mixed board today.', or 'Rough day out there.' Pick the opener based on the actual live data. "
            "Vary the opener across replies using the recent assistant history, and do not overuse 'Markets are on a roll.' "
        )

    messages = [
        {
            "role": "system",
            "content": (
                f"You are Bourse AI. Here is the live market context: {live_context}. "
                f"{response_scope}"
                "You have memory of this conversation. If the user already asked about a stock earlier in the chat, you already have that data — do not say you dont have it. "
                "Always cite specific numbers from the live context. "
                "Never make up prices. If asked about a stock not in this list, say you don't have live data for it "
                "but can explain it generally. Never give direct buy/sell advice. "
                "Never end with a standalone disclaimer or an asterisk disclaimer. If risk context is useful, weave it naturally into the last sentence, "
                "like 'As always, do your own research before making any moves.' or 'Worth doing your own digging before jumping in.' "
                "Talk like a smart friend who follows stocks: casual, warm, and short. "
                f"{opener_instruction}"
                "Do not bold the opening line. Never say Market Mood, Insight, Summary, or any label. Just talk naturally. "
                "Format responses using markdown. Use bullet points for lists of stocks. "
                "Use bold only for stock tickers or very short natural emphasis, not section labels. Keep responses concise, maximum 6 lines. "
                f"{'Do not use bullet points for single-stock answers. ' if is_specific_stock_question else ''}"
                "Do not use markdown tables, HTML tags, LaTeX, or long article-style sections."
            ),
        },
        *history,
        {"role": "user", "content": user_message},
    ]

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": 0.35,
                "max_tokens": 1000,
                "reasoning_effort": "low",
            },
        )
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as error:
            raise HTTPException(
                status_code=error.response.status_code,
                detail=groq_error_detail(error, "Groq chat request failed. Check GROQ_API_KEY and model access."),
            ) from error

    data = response.json()
    reply = format_chat_reply(str(data["choices"][0]["message"].get("content") or ""))
    if not reply:
        reply = "The market has enough movement to watch closely today.\n**Bourse AI**\nI could not format a complete response from the model just now. Please try again in a moment."
    return {"reply": reply}


async def fetch_insight_context(ticker: str):
    return await asyncio.gather(
        fetch_finnhub(f"/quote?symbol={ticker}"),
        fetch_finnhub(f"/stock/profile2?symbol={ticker}"),
        fetch_finnhub(f"/stock/metric?symbol={ticker}&metric=all"),
    )


def parse_three_bullets(content: str) -> list[str]:
    lines = [re.sub(r"^[-*•\d.\s]+", "", line).strip() for line in content.splitlines()]
    bullets = [line for line in lines if line]
    return bullets[:3]

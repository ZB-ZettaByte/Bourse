# Bourse

Bourse is a personal stock research project. It combines live market data, semantic stock search, stock detail pages, company news, and AI-assisted market context in one focused web app.

## Overview

Bourse helps users search for stocks naturally, open a detailed stock research page, review market movers, and ask an AI assistant concise finance questions. The project is designed as a practical full-stack portfolio project rather than a commercial startup.

## Problem Statement

Stock research often requires switching between many tools for quotes, charts, news, company profiles, and quick explanations. Bourse explores how these pieces can be combined into one cleaner workflow for learning, comparing, and monitoring stocks.

## Key Features

- Semantic stock search powered by a FastAPI backend and vector embeddings.
- Live market summary with top gaining stocks, trending stocks, market proxies, and charts.
- Stock detail pages with quote data, range charts, company profile, stats, news, and AI insights.
- Floating Bourse AI chat assistant using Groq for finance explanations and live stock context.
- Company logos from Finnhub where available, with graceful fallbacks.
- Responsive dark/light interface built for stock research and portfolio context.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Python
- AI and Search: Groq, sentence-transformers, FAISS
- Market Data: Finnhub API
- Charts and UI: Recharts, Lucide React
- Package Manager: pnpm

## Screenshots

Add screenshots here after deployment:

- Landing page
- Market summary page
- Stock detail page
- Bourse AI chat

## Demo Video

Add a demo video link here.

## Getting Started

Clone the repository:

```bash
git clone https://github.com/ZB-ZettaByte/Bourse.git
cd Bourse
```

Install frontend dependencies:

```bash
pnpm install
```

Create a `.env` file:

```bash
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_key
FINNHUB_API_KEY=your_finnhub_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-20b
```

Install backend dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Start the FastAPI backend:

```bash
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Start the Next.js app:

```bash
pnpm run dev
```

Open:

```bash
http://localhost:3000
```

## Current Status

Bourse is a working personal project with live market data, semantic search, AI chat, stock detail pages, and a responsive UI. Some features, such as watchlists and production deployment polish, are still evolving.

## Future Improvements

- Add persistent user watchlists.
- Add authentication for saved portfolios.
- Improve stock comparison pages.
- Add more financial statements and earnings data.
- Add richer screenshots and a walkthrough video.
- Improve deployment setup for frontend and backend hosting.

## Author

Sai Rithwik Kukunuri

## License

This project is available for personal learning and portfolio use. Add a formal license before using it in a public or commercial setting.

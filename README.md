# Bourse — AI Stock Research Platform

Bourse is a personal stock research platform built for exploring companies, tracking market trends, and analyzing U.S. stocks in a simple interface.

## Features

- **Stock Search:** Search and discover U.S. stocks using semantic search and natural-language queries.
- **Market Tracking:** Monitor live prices, trending stocks, and market activity in real time.
- **Company Analysis:** View company details, charts, news, statistics, and AI-powered insights.
- **AI Assistant:** Ask finance-related questions through an integrated AI assistant powered by Groq.
- **Financial News:** Access live company and market news using Finnhub APIs.
- **Responsive UI:** Simple and responsive interface built for market research and stock analysis.

## Screenshots

<div align="center">

<img src="screenshots/hero-landing-page.png" width="49%" />
<img src="screenshots/market-dashboard.png" width="49%" />

<img src="screenshots/semantic-stock-search.png" width="49%" />
<img src="screenshots/stock-overview-chart.png" width="49%" />

<img src="screenshots/stock-financials.png" width="49%" />
<img src="screenshots/stock-news-feed.png" width="49%" />

<img src="screenshots/feature-workflow-section.png" width="49%" />
<img src="screenshots/contact-page.png" width="49%" />

<img src="screenshots/research-platform-footer.png" width="90%" />

</div>

### Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Python
- AI and Search: Groq, sentence-transformers, FAISS
- Market Data: Finnhub API
- Charts and UI: Recharts, Lucide React
- Package Manager: pnpm

### Screenshots

Add screenshots here after deployment:

- Landing page
- Market summary page
- Stock detail page
- Bourse AI chat

### Demo Video

Add a demo video link here.

### Getting Started

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

### Current Status

Bourse is a working personal project with live market data, semantic search, AI chat, stock detail pages, and a responsive UI. Some features, such as watchlists and production deployment polish, are still evolving.

### Future Improvements

- Add persistent user watchlists.
- Add authentication for saved portfolios.
- Improve stock comparison pages.
- Add more financial statements and earnings data.
- Add richer screenshots and a walkthrough video.
- Improve deployment setup for frontend and backend hosting.

### Author

Sai Rithwik Kukunuri

### License

This project is available for personal learning and portfolio use. Add a formal license before using it in a public or commercial setting.

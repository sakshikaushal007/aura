# Aura — AI Beauty Advisor (Prototype)

This repository contains a static prototype for an AI-powered beauty advisor called "Aura".

Overview
- Frontend: Static HTML/CSS/JS (mobile-first) with a multi-step beauty quiz, filters, product grid, and animated UI.
- Mock AI: Simple client-side scoring and explanation generator; example Node server provided to show how an LLM could be integrated.
- Data: `data/products.json` contains product schema examples.

Run (static)
1. Open `index.html` in your browser (double-click or use a local static server).

Optional: run a simple static server (Node)
```
python -m http.server 8000
# or
npx serve .
```

Sample Backend AI Flow (example)
- See `server/server.js` for an example Express route that would accept user input and call an LLM (e.g., OpenAI).
- The sample server is illustrative — store your API keys securely (ENV variables), and do not expose them to the browser.

Next steps to production
- Replace the mock recommendation logic with a server-side LLM integration (GPT or other models).
- Add authentication and persistent user profiles (JWT/OAuth).
- Migrate products to a database (Postgres, MongoDB) and provide filtered APIs.
- Add image CDN and caching, accessibility improvements, and A/B test animations.

Design tokens & assets
- Colors are defined in `styles.css` : use the purple palette for brand consistency.

If you want, I can:
- Wire up a real Node + Express backend and example OpenAI call (server-side) using your OpenAI key.
- Convert this prototype into a React/Next.js app with SSR and better state management.

# Next.js AI Agent Chat Demo

A modern, open-source AI chat agent built with [Next.js](https://nextjs.org/), [React](https://react.dev/), and [AI SDK](https://sdk.vercel.ai/docs). This project demonstrates a simple yet powerful chat interface powered by OpenAI's GPT-4.1-nano model, with streaming responses and a clean, responsive UI.

---

## Features

- 🤖 **Conversational AI**: Chat with an AI assistant powered by OpenAI's GPT-4.1-nano.
- ⚡ **Streaming Responses**: See the AI's responses stream in real time.
- 🎨 **Modern UI**: Responsive, accessible, and styled with Tailwind CSS.
- 🚀 **Edge Runtime**: Fast, scalable API endpoints using Next.js edge functions.
- 🛠️ **TypeScript**: Fully typed for safety and developer experience.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/jnurkka/nextjs-agent-demo.git
cd nextjs-agent-demo
npm install
```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the chat agent.

---

## Project Structure

- `src/app/page.tsx` – Main chat UI (client component)
- `src/app/api/chat/route.ts` – Edge API route for streaming chat (OpenAI backend)
- `src/app/layout.tsx` – Global layout and font setup
- `src/app/globals.css` – Global styles (Tailwind CSS)

---

## Deployment

Deploy easily to [Vercel](https://vercel.com/) or any platform supporting Next.js:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new?repo=https://github.com/YOUR_GITHUB_USERNAME/nextjs-agent-demo)

---

## License

[MIT](LICENSE) (or add your preferred license)

---

## Acknowledgements
- [Next.js](https://nextjs.org/)
- [OpenAI](https://openai.com/)
- [AI SDK](https://sdk.vercel.ai/docs)
- [Tailwind CSS](https://tailwindcss.com/)

---

> _Feel free to open issues or pull requests to contribute!_

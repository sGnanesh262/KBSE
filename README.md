# KBSA — Knowledge-base Search Engine

This project is a lightweight knowledge-base search engine demo. Upload documents (TXT/PDF), index them with a retrieval pipeline, and ask natural-language questions — the app performs retrieval-augmented generation (RAG) using Google Gemini (Generative AI).

This README documents how to run the project locally, how the RAG pipeline works, and how to configure credentials for development.

## Features

- Client React app to upload documents and ask questions
- Server-side RAG pipeline with:
  - `/api/ingest` — index parsed documents by chunking and embedding
  - `/api/query` — retrieve top-k chunks and synthesize answer with Gemini
  - `/api/generate` — legacy endpoint that synthesizes from full documents
- In-memory vector store for demos (replaceable by Pinecone/Weaviate/pgvector)

## Quick start (local)

Prerequisites
- Node.js 18+ (recommended)
- A Google Generative AI credential for server-side usage (API key or service account)

Install dependencies:

```powershell
Set-Location D:\KBSA
npm install
```

Create a `.env.local` in the project root with either an API key (temporary) or a path to a service account JSON for ADC (recommended):

```text
# Temporary (API key)
GEMINI_API_KEY=your_api_key_here

# Or (recommended server-side, Application Default Credentials)
GOOGLE_APPLICATION_CREDENTIALS=D:/KBSA/keys/gcloud-sa.json
```

Start the dev servers (Vite + local backend):

```powershell
npm run dev
```

Open http://localhost:3000 to use the UI.

## API (server)

All API routes are served from the dev server's proxy `/api/*` to the backend on port 4000.

- POST /api/ingest   — Body: { documents: [{name, content}] }
  - Chunks text, generates embeddings (demo uses a deterministic local embedding), and stores vectors in memory.
  - Returns: { status: 'ok', added: number }

- POST /api/query    — Body: { query: string, topK?: number }
  - Embeds the query, retrieves top-k chunks, builds a document-centered prompt, calls Gemini, and returns { text, retrieved }.

- POST /api/generate — Body: { documents, query }
  - Legacy endpoint: synthesizes directly from provided documents (kept for compatibility).

## How RAG works in this project

1. Client parses uploaded files into text and POSTs the parsed documents to `/api/ingest`.
2. Server chunks each document, computes embeddings, and stores vectors in an in-memory list.
3. On query, the server embeds the query, finds top-k similar chunks by cosine similarity, assembles context, and calls Gemini to produce a concise answer.

The demo uses a simple deterministic local embedding function. For production-quality retrieval, replace `simpleTextEmbedding` with a real embedding API and use a vector DB.

## Security and credentials

- Do NOT commit `.env.local` or service account JSONs. This repo includes `.gitignore` entries for these.
- If you used or shared a real API key publicly, revoke it and generate a new one.
- For production, store secrets in a secret manager (GCP Secret Manager, environment variables on the host, or your cloud provider's secret store).

## Next steps and improvements

- Replace demo embeddings with Google GenAI embeddings or another embeddings provider.
- Swap in a persistent vector store (Pinecone, Weaviate, or pgvector).
- Add unit tests for chunking, embedding, and retrieval; add a CI workflow.
- Improve chunking strategy and overlap tuning for better retrieval accuracy.

## Troubleshooting

- `Could not load default credentials` — set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON or set `GEMINI_API_KEY` in `.env.local` for temporary testing.
- `Permission denied` when pushing to GitHub — ensure your git remote points to a repo you own and your GitHub credentials are authenticated locally.

## License

This project is provided as-is for demo and learning purposes.
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1v-v_intiAUgMkx0QFRUuVffDxnDFq0GK

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure credentials (recommended: use a service account)

   - Copy `.env.example` to `.env.local` and update values:

     - `GEMINI_API_KEY` (optional)
     - `GOOGLE_APPLICATION_CREDENTIALS` (recommended): absolute path to your service-account JSON key, e.g. `D:/KBSA/keys/gcloud-sa.json`

   - Example `.env.local`:

     ```text
     GEMINI_API_KEY=your_gemini_api_key_here
     GOOGLE_APPLICATION_CREDENTIALS=D:/KBSA/keys/gcloud-sa.json
     ```

   - Make sure the service-account JSON file exists at the path you provided.

3. Run the app:
   `npm run dev`

PowerShell tip (temporary env for current shell):

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'D:\KBSA\keys\gcloud-sa.json'
$env:GEMINI_API_KEY = 'your_gemini_api_key_here'
npm run dev
```

Security notes:

- Do NOT commit `.env.local` or service account JSON to version control. Add them to `.gitignore`.
- If any key has been exposed, revoke it immediately and create new credentials.


import express from 'express';
import bodyParser from 'body-parser';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config(); // loads .env, .env.local etc from project root

import fs from 'fs';

// Debug: print whether env vars are loaded (don't print secret values)
console.log('GEMINI_API_KEY present?', !!process.env.GEMINI_API_KEY);
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || '(not set)');
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log('Service account file exists?', fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS));
}

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json({ limit: '5mb' }));

// Prefer API key for temporary/testing usage. If GEMINI_API_KEY is set, use it and avoid ADC.
let ai = null;
const model = 'gemini-2.5-flash';

if (process.env.GEMINI_API_KEY) {
  console.log('Using GEMINI_API_KEY for authentication (API key mode).');
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log('GEMINI_API_KEY not set; using Application Default Credentials (service account)');
  ai = new GoogleGenAI();
} else {
  console.error('No GEMINI_API_KEY or GOOGLE_APPLICATION_CREDENTIALS found. For temporary usage set GEMINI_API_KEY in .env.local or as an env var.');
  // don't instantiate ai - handler will return a helpful error
}

const buildPrompt = (documents, query) => {
  let context = 'CONTEXT:\n';
  documents.forEach(doc => {
    context += `--- Document: ${doc.name} ---\n`;
    context += `${doc.content.trim()}\n\n`;
  });

  const instructions = `INSTRUCTIONS:\nYou are an expert Q&A assistant. Use the provided CONTEXT from the documents as your primary source of truth and revolve your answer around that content.\n\n- If the CONTEXT contains a clear answer to the user's question (including definitions or acronym expansions), answer using the CONTEXT and do not add unrelated external info.\n- If the CONTEXT does NOT contain the answer, use Gemini's general knowledge to answer the question, but still keep the answer concise and relevant to the user's query.\n- Produce a concise, direct answer (1-3 sentences). Do NOT list sources or add a "Sources:" line.\n\nExamples:\nContext: 'RAG (Retrieval-Augmented Generation) is a technique that combines retrieval mechanisms with a generative model to ground responses in external documents.'\nQ: 'What is RAG?'\nA: 'RAG stands for Retrieval-Augmented Generation — a method that uses retrieved documents to ground a generative model's responses.'\n\nContext: '' (empty)\nQ: 'What is RAG?'\nA: 'RAG, or Retrieval-Augmented Generation, is a technique that augments a generative model with an external retrieval step so responses can be grounded in documents.'\n`;
  return `${instructions}\n\n${context}\n--- QUESTION ---\n${query}`;
};

// --- In-memory vector store (simple demo implementation) ---
const VECTOR_DIM = 128;
const vectorStore = [];

function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - overlap;
  }
  return chunks;
}

function simpleTextEmbedding(text) {
  // deterministic simple embedding: hash words into a fixed-size vector
  const vec = new Array(VECTOR_DIM).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    let h = 0;
    for (let i = 0; i < w.length; i++) {
      h = (h * 31 + w.charCodeAt(i)) >>> 0;
    }
    const idx = h % VECTOR_DIM;
    vec[idx] += 1;
  }
  // normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

function cosineSim(a, b) {
  let s = 0;
  for (let i = 0; i < VECTOR_DIM; i++) s += a[i] * b[i];
  return s;
}

// Ingest endpoint: accept parsed documents [{name, content}]
app.post('/api/ingest', async (req, res) => {
  try {
    const { documents } = req.body;
    if (!documents || !Array.isArray(documents)) return res.status(400).json({ error: 'documents array is required' });

    let added = 0;
    for (const doc of documents) {
      const chunks = chunkText(doc.content || '');
      for (let i = 0; i < chunks.length; i++) {
        const chunkTextStr = chunks[i];
        const embedding = simpleTextEmbedding(chunkTextStr);
        vectorStore.push({ id: `${doc.name}::${i}`, docName: doc.name, text: chunkTextStr, embedding });
        added++;
      }
    }
    res.json({ status: 'ok', added });
  } catch (err) {
    console.error('Error in /api/ingest:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Query endpoint: embed query, retrieve top-k chunks, and synthesize answer with LLM
app.post('/api/query', async (req, res) => {
  try {
    if (!ai) return res.status(400).json({ error: 'AI client not configured. Set GEMINI_API_KEY in .env.local or set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON.' });
    const { query, topK = 5 } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    if (vectorStore.length === 0) return res.status(400).json({ error: 'No documents indexed. Call /api/ingest with parsed documents first.' });

    const qEmb = simpleTextEmbedding(query);
    // compute similarities
    const sims = vectorStore.map(v => ({ score: cosineSim(qEmb, v.embedding), item: v }));
    sims.sort((a, b) => b.score - a.score);
    const top = sims.slice(0, topK).map(s => s.item);

    // Build context from top chunks
    const contextDocs = top.map(t => `--- Document: ${t.docName} ---\n${t.text}`).join('\n\n');
  const instructions = `INSTRUCTIONS:\nYou are an expert Q&A assistant. Use the retrieved CONTEXT from the documents as the primary source and revolve your answer around it.\n\n- If the CONTEXT contains the answer (including definitions or acronym expansions), reply using the CONTEXT verbatim or synthesized from it.\n- If the CONTEXT does NOT contain the answer, use Gemini's general knowledge to answer succinctly.\n- Keep answers concise (1-3 sentences). Do NOT include a "Sources:" list or metadata.\n\nExample:\nCONTEXT: 'RAG (Retrieval-Augmented Generation) is a technique that combines retrieval with generation.'\nQ: 'What is RAG?'\nA: 'RAG stands for Retrieval-Augmented Generation — a technique that combines a retrieval step with a generative model so responses can be grounded in documents.'\n`;
  const prompt = `${instructions}\n\nCONTEXT:\n${contextDocs}\n--- QUESTION ---\n${query}`;

    // Call the LLM
    const response = await ai.models.generateContent({ model, contents: prompt });
    res.json({ text: response.text, retrieved: top.map(t => ({ docName: t.docName, snippet: t.text })) });
  } catch (err) {
    console.error('Error in /api/query:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    if (!ai) return res.status(400).json({ error: 'AI client not configured. Set GEMINI_API_KEY in .env.local or set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON.' });
    const { documents, query } = req.body;
    if (!documents || !query) return res.status(400).json({ error: 'documents and query are required' });

    const prompt = buildPrompt(documents, query);

    const response = await ai.models.generateContent({ model, contents: prompt });
    res.json({ text: response.text });
  } catch (err) {
    console.error('Error in /api/generate:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Serve static for production if needed
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

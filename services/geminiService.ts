import { DocumentFile } from '../types';

// Client-side wrapper: forward the request to the backend API which holds the secret key.
export const getSynthesizedAnswer = async (documents: DocumentFile[], query: string): Promise<string> => {
    try {
        const resp = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documents, query }),
        });

        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Server error: ${resp.status} ${text}`);
        }

        const data = await resp.json();
        return data.text;
    } catch (err) {
        console.error('Error calling /api/generate:', err);
        if (err instanceof Error) return `Failed to get an answer from the server. Details: ${err.message}`;
        return 'An unexpected error occurred while contacting the server.';
    }
};

export const ingestDocuments = async (documents: DocumentFile[]): Promise<{ status: string; added?: number } | { error: string }> => {
    try {
        const resp = await fetch('/api/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documents }),
        });
        return await resp.json();
    } catch (err) {
        console.error('Error calling /api/ingest:', err);
        return { error: err instanceof Error ? err.message : String(err) };
    }
};

export const queryServer = async (query: string, topK = 5): Promise<any> => {
    try {
        const resp = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, topK }),
        });
        return await resp.json();
    } catch (err) {
        console.error('Error calling /api/query:', err);
        return { error: err instanceof Error ? err.message : String(err) };
    }
};
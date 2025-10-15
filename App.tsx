import React, { useState, useCallback, useEffect } from 'react';
import { DocumentFile, ChatMessage } from './types';
import { Sender } from './types';
import { parseFiles } from './services/fileParserService';
import { getSynthesizedAnswer, ingestDocuments, queryServer } from './services/geminiService';
import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import ChatWindow from './components/ChatWindow';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const App: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setChatHistory([
            {
                sender: Sender.AI,
                text: "Welcome! Please upload one or more .txt or .pdf documents to begin. Then, ask me any question about their content.",
            },
        ]);
    }, []);

    const handleFileUpload = useCallback(async (files: FileList) => {
        setIsLoading(true);
        setError(null);
        try {
            const parsedDocuments = await parseFiles(files);
            const newDocuments = parsedDocuments.filter(newDoc => 
                !documents.some(existingDoc => existingDoc.name === newDoc.name)
            );
            setDocuments(prevDocs => [...prevDocs, ...newDocuments]);
            // send parsed documents to server for indexing
            try {
                const resp = await ingestDocuments(newDocuments);
                if (resp && 'status' in resp && resp.status === 'ok') {
                    setChatHistory(prev => [...prev, { sender: Sender.AI, text: `Indexed ${resp.added ?? newDocuments.length} document chunk(s) for retrieval.` }]);
                } else if (resp && 'error' in resp) {
                    setChatHistory(prev => [...prev, { sender: Sender.AI, text: `Indexing error: ${resp.error}` }]);
                }
            } catch (e) {
                // ignore indexing errors here
            }
            if (newDocuments.length > 0) {
                 setChatHistory(prev => [...prev, { sender: Sender.AI, text: `Successfully added ${newDocuments.length} new document(s). You can now ask questions about the updated knowledge base.` }]);
            } else if (parsedDocuments.length > 0) {
                 setChatHistory(prev => [...prev, { sender: Sender.AI, text: `The selected documents were already in the knowledge base.` }]);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during file parsing.';
            setError(errorMessage);
            setChatHistory(prev => [...prev, { sender: Sender.AI, text: `Error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [documents]);

    const handleRemoveDocument = useCallback((docName: string) => {
        setDocuments(prevDocs => prevDocs.filter(doc => doc.name !== docName));
        setChatHistory(prev => [...prev, { sender: Sender.AI, text: `Removed document: "${docName}".` }]);
    }, []);

    const handleQuerySubmit = useCallback(async (query: string) => {
        if (!query.trim()) return;

        setChatHistory(prev => [...prev, { sender: Sender.USER, text: query }]);
        setIsLoading(true);
        setError(null);

        if (documents.length === 0) {
            setChatHistory(prev => [...prev, { sender: Sender.AI, text: "I can't answer without any documents. Please upload at least one .txt or .pdf file." }]);
            setIsLoading(false);
            return;
        }

        try {
            // Use retrieval pipeline: send query to server which will retrieve top-k chunks and synthesize
            const resp = await queryServer(query, 5);
            if (resp && resp.text) {
                setChatHistory(prev => [...prev, { sender: Sender.AI, text: resp.text }]);
                if (resp.retrieved) {
                    const refs = resp.retrieved.map((r: any) => `• ${r.docName}: ${r.snippet.slice(0, 120).replace(/\n/g, ' ')}...`).join('\n');
                    setChatHistory(prev => [...prev, { sender: Sender.AI, text: `Retrieved snippets:\n${refs}` }]);
                }
            } else if (resp && resp.error) {
                setChatHistory(prev => [...prev, { sender: Sender.AI, text: `Error: ${resp.error}` }]);
            } else {
                setChatHistory(prev => [...prev, { sender: Sender.AI, text: 'No answer returned from server.' }]);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while getting the answer.';
            setError(errorMessage);
            setChatHistory(prev => [...prev, { sender: Sender.AI, text: `Sorry, I ran into an error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [documents]);

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans">
            <Header />
            <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
                <div className="w-full md:w-1/3 lg:w-1/4 h-1/3 md:h-full border-b md:border-b-0 md:border-r border-slate-700 flex flex-col p-4 bg-slate-800/50">
                    <h2 className="text-xl font-semibold mb-4 text-cyan-400">Knowledge Base</h2>
                    <FileUpload onFileUpload={handleFileUpload} disabled={isLoading} />
                    <DocumentList documents={documents} onRemoveDocument={handleRemoveDocument} />
                </div>
                <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col h-2/3 md:h-full">
                    <ChatWindow 
                        messages={chatHistory} 
                        isLoading={isLoading} 
                        onQuerySubmit={handleQuerySubmit} 
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default App;
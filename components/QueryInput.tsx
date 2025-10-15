
import React, { useState } from 'react';
import { SendIcon } from './icons/SendIcon';

interface QueryInputProps {
  onQuerySubmit: (query: string) => void;
  disabled: boolean;
}

const QueryInput: React.FC<QueryInputProps> = ({ onQuerySubmit, disabled }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onQuerySubmit(query);
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a question about the documents..."
        disabled={disabled}
        className="flex-grow p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !query.trim()}
        className="p-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition"
        aria-label="Send query"
      >
        <SendIcon className="w-6 h-6" />
      </button>
    </form>
  );
};

export default QueryInput;

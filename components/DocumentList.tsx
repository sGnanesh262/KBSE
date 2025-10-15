
import React from 'react';
import { DocumentFile } from '../types';
import { FileTextIcon } from './icons/FileTextIcon';
import { XIcon } from './icons/XIcon';

interface DocumentListProps {
  documents: DocumentFile[];
  onRemoveDocument: (docName: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onRemoveDocument }) => {
  return (
    <div className="flex-grow overflow-y-auto pr-2 -mr-2">
      <h3 className="text-sm font-semibold text-slate-400 mb-2">Uploaded Documents</h3>
      {documents.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.name}
              className="flex items-center justify-between p-2 bg-slate-700/50 rounded-md group"
            >
              <div className="flex items-center min-w-0">
                <FileTextIcon className="w-5 h-5 mr-2 text-cyan-400 flex-shrink-0" />
                <span className="text-sm text-slate-300 truncate" title={doc.name}>{doc.name}</span>
              </div>
              <button
                onClick={() => onRemoveDocument(doc.name)}
                className="ml-2 p-1 rounded-full text-slate-400 hover:bg-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${doc.name}`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentList;

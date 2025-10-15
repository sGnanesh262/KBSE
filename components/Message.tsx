
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sender } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

interface MessageProps {
  sender: Sender;
  text: string;
  isLoading?: boolean;
}

const Message: React.FC<MessageProps> = ({ sender, text, isLoading }) => {
  const isUser = sender === Sender.USER;

  const containerClasses = isUser ? 'flex-row-reverse' : 'flex-row';
  const bubbleClasses = isUser
    ? 'bg-cyan-600 text-white rounded-br-none'
    : 'bg-slate-700 text-slate-200 rounded-bl-none';
  const iconClasses = isUser ? 'ml-3' : 'mr-3';
  const icon = isUser ? <UserIcon className="w-6 h-6" /> : <BrainCircuitIcon className="w-6 h-6 text-cyan-400" />;

  const markdownComponents = {
    p: ({ node, ...props }) => <p className="text-sm whitespace-pre-wrap" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
    li: ({ node, ...props }) => <li className="text-sm" {...props} />,
    code: ({ node, inline, className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || '');
        return !inline ? (
          <pre className="bg-slate-900/70 p-3 rounded-md my-2 overflow-x-auto">
            <code className={`font-mono text-sm ${className}`} {...props}>
              {children}
            </code>
          </pre>
        ) : (
          <code className="bg-slate-800/70 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded" {...props}>
            {children}
          </code>
        );
      },
  }


  return (
    <div className={`flex items-start ${containerClasses}`}>
      <div className={`flex-shrink-0 p-2 rounded-full bg-slate-600/50 ${iconClasses}`}>
        {icon}
      </div>
      <div className={`px-4 py-3 rounded-lg max-w-xl md:max-w-2xl ${bubbleClasses}`}>
        {isLoading ? (
          <div className="flex items-center justify-center space-x-1">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></span>
          </div>
        ) : isUser ? (
          <p className="text-sm whitespace-pre-wrap">{text}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};

export default Message;
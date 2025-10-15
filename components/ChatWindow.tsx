
import React, { useRef, useEffect } from 'react';
// FIX: Import `Sender` enum to use for prop typing.
import { ChatMessage, Sender } from '../types';
import Message from './Message';
import QueryInput from './QueryInput';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onQuerySubmit: (query: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onQuerySubmit }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <Message key={index} sender={msg.sender} text={msg.text} />
          ))}
          {/* FIX: Use `Sender.AI` enum member instead of the string literal "ai" to satisfy the `Sender` type. */}
          {isLoading && <Message sender={Sender.AI} text="..." isLoading={true} />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-slate-700">
        <QueryInput onQuerySubmit={onQuerySubmit} disabled={isLoading} />
      </div>
    </div>
  );
};

export default ChatWindow;

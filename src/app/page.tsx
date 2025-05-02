'use client';

import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({ api: '/api/chat' });

  // Always show the first AI message if the chat is empty
  const displayMessages = messages.length === 0
    ? [{ id: 'welcome', role: 'assistant', parts: [{ type: 'text', text: 'How can I help you today?' }] }]
    : messages;

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-gradient-to-br from-[#6a11cb] to-[#2575fc]">
      <div className="flex flex-col w-full max-w-2xl h-[90vh] bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-0 overflow-hidden">
        <header className="py-8 px-8 text-center">
          <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">AI Agent Chat</h1>
        </header>
        <div className="flex-1 flex flex-col gap-3 px-8 pb-4 overflow-y-auto">
          {displayMessages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] p-3 rounded-xl shadow-md text-base font-medium ${message.role === 'user' ? 'bg-gradient-to-r from-[#a259f7] to-[#6a11cb] text-white self-end' : 'bg-white/80 text-[#171717] self-start'}`}
            >
              <span className="font-bold mr-2 opacity-80">{message.role === 'user' ? 'You' : 'AI'}:</span>
              {message.parts.map((part, idx) => part.type === 'text' && <span key={idx}>{part.text}</span>)}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-3 px-8 py-6 bg-white/10 backdrop-blur-md">
          <input
            className="flex-1 rounded-xl px-4 py-3 bg-white/80 text-[#171717] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a259f7] font-medium shadow"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={status !== 'ready'}
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-[#a259f7] to-[#6a11cb] text-white px-6 py-3 rounded-xl font-bold shadow hover:scale-105 transition disabled:opacity-50"
            disabled={status !== 'ready' || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({ api: '/api/chat' });

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold my-4">AI Agent Chat</h1>
      <div className="w-full max-w-xl flex-1 flex flex-col gap-2 bg-white rounded shadow p-4 overflow-y-auto mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-2 rounded-md ${message.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}
          >
            <span className="font-semibold mr-2">{message.role === 'user' ? 'You' : 'AI'}:</span>
            {message.parts.map((part, idx) => part.type === 'text' && <span key={idx}>{part.text}</span>)}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-xl flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={status !== 'ready'}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={status !== 'ready' || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

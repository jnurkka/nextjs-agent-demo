'use client';

import { useChat } from '@ai-sdk/react';
import React, { useCallback, useState } from 'react';
import VoiceMode from './components/VoiceMode';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({ api: '/api/chat' });
  const [voiceMode, setVoiceMode] = useState(false);

  // Determine if chat is empty
  const isEmpty = messages.length === 0;

  // When sending a text message, submit via SDK
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleInputChange({ target: { value: input } } as React.ChangeEvent<HTMLInputElement>);
    handleSubmit(e);
  }, [input, handleInputChange, handleSubmit]);

  return (
    <div className="min-h-screen w-screen flex flex-col bg-white">
      <header className="py-8 px-8 text-center">
        <h1 className="text-xl font-bold text-black mb-2 drop-shadow-lg">AI Assistant</h1>
      </header>
      <div className={`flex-1 flex flex-col ${isEmpty && 'items-center justify-center'} w-full max-w-4xl mx-auto transition-all duration-300`}>
        {!isEmpty && (
          <div className="flex-1 flex flex-col gap-6 px-8 pb-4 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[70%] text-base font-medium ${message.role === 'user' ? 'bg-gray-200 text-black self-end rounded-2xl px-5 py-3 shadow-sm' : 'bg-transparent text-black self-start px-0 py-0 shadow-none'}`}
                style={message.role === 'user' ? { fontStyle: 'normal' } : { fontStyle: 'normal' }}
              >
                {message.parts.map((part, idx) => part.type === 'text' && <span key={idx}>{part.text}</span>)}
              </div>
            ))}
          </div>
        )}
        {isEmpty && (
          <div className="text-4xl text-black font-bold">How can I help you today?</div>
        )}
        <form
          onSubmit={handleFormSubmit}
          className={`flex gap-2 px-8 py-6 w-full justify-center`}
        >
          <div className="flex flex-1 items-center bg-white rounded-2xl shadow-lg px-4 py-3 border border-gray-200 mx-auto">
            <input
              className="flex-1 bg-transparent text-black placeholder:text-gray-400 focus:outline-none font-medium"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask anything"
              disabled={status !== 'ready'}
            />
            <button
              type="submit"
              className="ml-2 p-2 rounded-full hover:bg-gray-100 transition disabled:opacity-50"
              disabled={status !== 'ready' || !input.trim()}
              aria-label="Send"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l15.75-7.5-7.5 15.75-2.25-6.75-6.75-2.25z" />
              </svg>
            </button>
            <button
              type="button"
              className="ml-2 p-2 rounded-full hover:bg-gray-100 transition text-black"
              onClick={() => setVoiceMode(true)}
              aria-label="Activate Voice Mode"
              disabled={voiceMode}
            >
              <span role="img" aria-label="Voice Mode">🎤</span>
            </button>
          </div>
        </form>
        <div className="w-full flex justify-center pb-4">
          <div className="text-xs text-gray-400 text-center max-w-2xl mx-auto">
            You are using an autonomous AI Agent, which can make mistakes. By submitting a message you accept our <a href="#" className="underline">Terms & Conditions</a> and <a href="#" className="underline">Cookie Policy</a>
          </div>
        </div>
      </div>
      {voiceMode && <VoiceMode onExit={() => setVoiceMode(false)} handleSubmit={handleSubmit} handleInputChange={handleInputChange} input={input} messages={messages} />}
    </div>
  );
}

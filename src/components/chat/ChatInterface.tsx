'use client';

/**
 * ChatInterface Component - Main chat UI with messages and input
 */

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/parsers/types';
import { Send, Bot, User, Loader2, Plus, X, Check } from 'lucide-react';
import MessageContent from './MessageContent';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, customPrompt?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [showCitationHelp, setShowCitationHelp] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [appliedPrompt, setAppliedPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    const messageText = input.trim();
    setInput('');

    try {
      await onSendMessage(messageText, appliedPrompt || undefined);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleApplyPrompt = () => {
    setAppliedPrompt(customPrompt);
    setShowCustomPrompt(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Mr Craft (AI-Agent)
          </h2>

          {/* Custom Prompt Button */}
          <button
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            className={`group relative p-2 rounded-md hover:bg-gray-200 transition-all ${
              appliedPrompt ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''
            }`}
            title="Custom Instructions"
          >
            <Plus className={`w-5 h-5 ${appliedPrompt ? 'text-yellow-600' : 'text-gray-600'}`} />
            <span className="absolute right-0 top-full mt-1 w-48 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
              {appliedPrompt ? 'Custom instructions active' : 'Add custom instructions for the agent'}
            </span>
          </button>
        </div>

        {/* Citation Helper */}
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-600">
              Cite lines or pages to edit quickly via <code className="text-gray-800 bg-gray-100 px-1 rounded">@line5</code>
            </p>
            <button
              onClick={() => setShowCitationHelp(!showCitationHelp)}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              {showCitationHelp ? 'show less' : 'show more'}
            </button>
          </div>

          {/* Expandable Citation Examples */}
          {showCitationHelp && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-300 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <strong className="text-gray-800 block mb-1">Single Line:</strong>
                  <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-800">@line10</code>
                  {' or '}
                  <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-800">@l10</code>
                </div>
                <div>
                  <strong className="text-gray-800 block mb-1">Line Range:</strong>
                  <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-800">@l5-10</code>
                </div>
                <div>
                  <strong className="text-gray-800 block mb-1">Entire Page:</strong>
                  <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-800">@page3</code>
                  {' or '}
                  <code className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-800">@p3</code>
                </div>
                <div>
                  <strong className="text-gray-800 block mb-1">Example:</strong>
                  <span className="text-gray-700 text-xs">
                    "Change <code className="bg-white px-1 rounded text-gray-800">@l17</code> to $5M"
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Prompt Input */}
        {showCustomPrompt && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-800">
                Custom Instructions (Optional)
              </label>
              <button
                onClick={() => {
                  setShowCustomPrompt(false);
                  setCustomPrompt('');
                  setAppliedPrompt('');
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., 'Always use formal language', 'Format dates as MM/DD/YYYY', 'This is a licensing agreement'..."
              className="w-full text-sm text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-700">
                Guide the agent on how to edit or add document context
              </p>
              <button
                onClick={handleApplyPrompt}
                disabled={!customPrompt.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-3 h-3" />
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Start a conversation
            </h3>
            <p className="text-sm text-gray-700 max-w-sm">
              Ask me to search, read, or edit your document. Use citations like @line10 to reference specific parts.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Avatar */}
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                )}

                {/* Message Content */}
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <MessageContent
                    content={message.content}
                    role={message.role}
                    className={message.role === 'user' ? 'text-white' : 'text-gray-900'}
                  />

                  {/* Actions */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
                      {message.actions.map((action, idx) => (
                        <div
                          key={idx}
                          className="text-xs flex items-center gap-2"
                        >
                          <span
                            className={`w-2 h-2 flex-shrink-0 rounded-full ${
                              action.success ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          <span className="flex-1 break-words">
                            {action.type}: {JSON.stringify(action.details)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                {/* User Avatar */}
                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="max-w-[70%] rounded-lg px-4 py-2 bg-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message (use @line10 to cite)"
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

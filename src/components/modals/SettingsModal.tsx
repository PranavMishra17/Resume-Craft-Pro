'use client';

/**
 * Settings Modal - User settings, chat history, and API key configuration
 */

import { useState } from 'react';
import { X, Info, Key, Database, Shield, AlertCircle } from 'lucide-react';
import { Chat } from '@/lib/parsers/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  customApiKey: string | null;
  onApiKeyChange: (apiKey: string) => void;
  onClearApiKey: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  chats,
  customApiKey,
  onApiKeyChange,
  onClearApiKey
}: SettingsModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      onApiKeyChange(apiKeyInput.trim());
    }
  };

  const handleClearApiKey = () => {
    setApiKeyInput('');
    onClearApiKey();
  };

  // Calculate storage stats
  const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);
  const storageSize = new Blob([JSON.stringify(chats)]).size;
  const storageSizeKB = (storageSize / 1024).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Details Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Chat Storage
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Chats:</span>
                <span className="font-semibold text-gray-900">{chats.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Messages:</span>
                <span className="font-semibold text-gray-900">{totalMessages}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Storage Used:</span>
                <span className="font-semibold text-gray-900">{storageSizeKB} KB</span>
              </div>
            </div>
          </div>

          {/* API Key Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Key className="w-5 h-5 text-green-600" />
              Gemini API Key
              <button
                onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
                className="ml-auto p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Privacy & Security Information"
              >
                <Info className="w-5 h-5 text-blue-600" />
              </button>
            </h3>

            {/* Privacy Info Expandable */}
            {showPrivacyInfo && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-2">Privacy & Security:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Your chats are stored in browser cache (localStorage)</li>
                      <li>Chats persist across sessions but NOT across devices</li>
                      <li>Data is private to you and never leaves your browser</li>
                      <li>Custom API keys are stored securely in localStorage</li>
                      <li>We don't store or transmit your API key to any server</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {customApiKey ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">
                      Using Custom API Key
                    </span>
                  </div>
                  <p className="text-sm text-green-800 mb-3">
                    All API calls are using your custom Gemini API key.
                  </p>
                  <button
                    onClick={handleClearApiKey}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    Remove Custom Key (Use Default)
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-900">
                      Using Default API Key
                    </span>
                  </div>
                  <p className="text-sm text-yellow-800">
                    You're using the developer's free-tier Gemini API key.
                    This is safe for testing, but may have usage limits.
                    Add your own key for unlimited access.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom API Key (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Get your API key from:{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save API Key
              </button>
            </div>
          </div>

          {/* Recent Chat History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Recent Chats
            </h3>
            {chats.length === 0 ? (
              <p className="text-sm text-gray-600">No chats yet. Start by uploading a document!</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {chats.slice(0, 10).map((chat) => (
                  <div
                    key={chat.id}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {chat.messages.length} messages •
                      {' '}{new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

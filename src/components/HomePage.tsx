'use client'

import Image from 'next/image'
import { Sparkles, FolderOpen, Settings, ChevronRight } from 'lucide-react'

interface HomePageProps {
  onStartNewChat: () => void
  onLoadPreviousChat: () => void
  onOpenSettings: () => void
  previousChats: Array<{ id: string; title: string; timestamp: Date }>
}

export default function HomePage({
  onStartNewChat,
  onLoadPreviousChat,
  onOpenSettings,
  previousChats = []
}: HomePageProps) {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl w-full mx-auto px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 transform hover:scale-105 transition-transform">
              <Image
                src="/images/title.png"
                alt="Resume-Craft-Pro Logo"
                width={128}
                height={128}
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Resume-Craft-Pro
          </h1>

          {/* Tagline */}
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
            Craft the Perfect Resume with AI-Powered Precision
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              <span>Intelligent Keyword Optimization</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <span>AI-Powered Content Enhancement</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              <span>Targeted Job-Specific Tailoring</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              <span>Manual Agentic Chat Control</span>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Start New Chat Card */}
          <button
            onClick={onStartNewChat}
            className="group relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02] border-2 border-transparent hover:border-purple-500 dark:hover:border-purple-600"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Start a New Chat
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload your resume and begin crafting the perfect application with AI assistance
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0" />
            </div>
          </button>

          {/* Load Previous Chat Card */}
          <button
            onClick={onLoadPreviousChat}
            disabled={previousChats.length === 0}
            className="group relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02] border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-transparent"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Load Previous Chat
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {previousChats.length > 0
                    ? `Continue from one of your ${previousChats.length} saved conversation${previousChats.length > 1 ? 's' : ''}`
                    : 'No previous chats available'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </div>
          </button>
        </div>

        {/* Settings Button */}
        <div className="flex justify-center">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-3 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors border border-gray-300 dark:border-gray-700"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">API Settings</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-500">
          <p>Powered by AI • Built for Excellence • Optimized for Success</p>
        </div>
      </div>
    </div>
  )
}

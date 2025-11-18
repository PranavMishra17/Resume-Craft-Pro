'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import ChatHistory from './ChatHistory'

interface TabbedLeftPanelProps {
  chats: any[]
  currentChat: any
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  contextFiles: {
    resume?: any
    projects?: any
    portfolio?: any
    jobDescription?: any
  }
  onFilesChange: (files: any) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function TabbedLeftPanel({
  chats,
  currentChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isCollapsed = false,
  onToggleCollapse
}: TabbedLeftPanelProps) {
  return (
    <div className={`relative h-full flex flex-col bg-white dark:bg-gray-900 transition-all duration-300 ${
      isCollapsed ? 'w-0' : 'w-80 border-r border-gray-200 dark:border-gray-700'
    }`}>
      {/* Collapse/Expand Button - Better styling */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-16 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 border-l-0 rounded-r-lg flex items-center justify-center shadow-md transition-colors"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Content - Only Chat History */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatHistory
            chats={chats}
            currentChat={currentChat}
            onNewChat={onNewChat}
            onSelectChat={onSelectChat}
            onDeleteChat={onDeleteChat}
          />
        </div>
      )}
    </div>
  )
}

'use client';

/**
 * ChatHistory Component - Collapsible sidebar showing previous chats
 */

import { useState, useEffect, useRef } from 'react';
import { Chat } from '@/lib/parsers/types';
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

interface ChatHistoryProps {
  chats: Chat[];
  currentChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

export default function ChatHistory({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat
}: ChatHistoryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240); // Default 240px
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('clausecraft-sidebar-width');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }
  }, []);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;

      const newWidth = e.clientX;
      // Clamp width between 200px and 400px
      const clampedWidth = Math.max(200, Math.min(400, newWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Save width to localStorage
      localStorage.setItem('clausecraft-sidebar-width', sidebarWidth.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      onDeleteChat(chatId);
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={`h-full flex flex-col bg-gray-50 border-r border-gray-200 transition-all duration-300 relative ${
        isCollapsed ? 'w-12' : ''
      }`}
      style={!isCollapsed ? { width: `${sidebarWidth}px` } : undefined}
    >
      {/* Collapse/Expand Button */}
      <div className="flex-shrink-0 p-2 border-b border-gray-200 bg-white flex justify-end">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-700" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">New Chat</span>
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-2">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-600">
                  No chat history yet.<br />Start a new chat to begin.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {chats
                  .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                  .map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => onSelectChat(chat.id)}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                        currentChatId === chat.id
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-white hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {chat.title}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            {chat.messages.length} messages
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(chat.updatedAt || chat.createdAt)}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteClick(e, chat.id)}
                          className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-opacity"
                          title="Delete chat"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>

                      {/* Last message preview */}
                      {chat.messages.length > 0 && (
                        <p className="text-xs text-gray-700 mt-2 truncate">
                          {chat.messages[chat.messages.length - 1].content}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
            <p className="text-xs text-gray-600 text-center">
              {chats.length} {chats.length === 1 ? 'chat' : 'chats'} total
            </p>
          </div>
        </>
      )}

      {/* Collapsed State - Show Icon Only */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          <button
            onClick={onNewChat}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
          {chats.length > 0 && (
            <div className="text-xs text-gray-600 transform -rotate-90 whitespace-nowrap">
              {chats.length} chats
            </div>
          )}
        </div>
      )}

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={handleResizeStart}
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
            isResizing ? 'bg-blue-500' : ''
          } group`}
          title="Drag to resize"
        >
          <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
}

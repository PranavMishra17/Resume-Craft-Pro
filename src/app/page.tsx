'use client'

/**
 * Resume-Craft-Pro - Homepage
 * Landing page with navigation to chat interface
 */

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import HomePage from '@/components/HomePage'
import { loadChats } from '@/lib/storage/chats'
import { Chat } from '@/lib/parsers/types'

export default function Home() {
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    // Load existing chats
    const storedChats = loadChats()
    setChats(storedChats)
  }, [])

  const handleStartNewChat = () => {
    console.log('[HOMEPAGE] Starting new chat')
    router.push('/chat?new=true')
  }

  const handleLoadPreviousChat = () => {
    console.log('[HOMEPAGE] Loading previous chat')
    router.push('/chat')
  }

  const handleOpenSettings = () => {
    console.log('[HOMEPAGE] Opening settings')
    router.push('/chat?settings=true')
  }

  return (
    <HomePage
      onStartNewChat={handleStartNewChat}
      onLoadPreviousChat={handleLoadPreviousChat}
      onOpenSettings={handleOpenSettings}
      previousChats={chats}
    />
  )
}

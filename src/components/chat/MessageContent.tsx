'use client';

/**
 * MessageContent Component - Renders message content with markdown support
 */

import { useMemo } from 'react';
import { renderMarkdownSafe } from '@/lib/markdown/renderer';

interface MessageContentProps {
  content: string;
  role: 'user' | 'assistant';
  className?: string;
}

export default function MessageContent({ content, role, className = '' }: MessageContentProps) {
  // Only render markdown for assistant messages
  const htmlContent = useMemo(() => {
    if (role === 'assistant') {
      return renderMarkdownSafe(content);
    }
    return null;
  }, [content, role]);

  if (role === 'user') {
    // User messages: plain text with line breaks
    return (
      <p className={`text-sm whitespace-pre-wrap break-words ${className}`}>
        {content}
      </p>
    );
  }

  // Assistant messages: rendered markdown
  return (
    <div
      className={`text-sm markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
    />
  );
}

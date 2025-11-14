/**
 * Chat Storage - LocalStorage wrapper for persisting chat history
 * Includes IndexedDB for original file storage (format preservation)
 */

import { Chat, Message, Document, OriginalDocument, EditHistory } from '../parsers/types';
import { randomUUID } from 'crypto';

const STORAGE_KEY = 'resume-craft-pro-chats';
const DOCUMENT_STORAGE_KEY = 'resume-craft-pro-documents';
const EDIT_HISTORY_KEY = 'resume-craft-pro-edit-history';
const INDEXEDDB_NAME = 'ResumeCraftPro';
const ORIGINAL_FILES_STORE = 'original-files';

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    console.error('[STORAGE] localStorage not available:', error);
    return false;
  }
}

/**
 * Load all chats from localStorage
 */
export function loadChats(): Chat[] {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('[STORAGE] localStorage not available');
      return [];
    }

    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      console.info('[STORAGE] No chats found in storage');
      return [];
    }

    const chats: Chat[] = JSON.parse(stored);

    // Convert date strings back to Date objects
    chats.forEach(chat => {
      chat.createdAt = new Date(chat.createdAt);
      if (chat.updatedAt) {
        chat.updatedAt = new Date(chat.updatedAt);
      }

      chat.messages.forEach(msg => {
        msg.timestamp = new Date(msg.timestamp);
      });
    });

    console.info(`[STORAGE] Loaded ${chats.length} chats from storage`);

    return chats;

  } catch (error) {
    console.error('[STORAGE] Error loading chats:', error);
    return [];
  }
}

/**
 * Save all chats to localStorage
 */
export function saveChats(chats: Chat[]): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('[STORAGE] localStorage not available');
      return false;
    }

    const serialized = JSON.stringify(chats);
    localStorage.setItem(STORAGE_KEY, serialized);

    console.info(`[STORAGE] Saved ${chats.length} chats to storage`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error saving chats:', error);
    return false;
  }
}

/**
 * Create a new chat
 */
export function createChat(title: string, documentId?: string): Chat {
  const chat: Chat = {
    id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    messages: [],
    documentId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.info(`[STORAGE] Created new chat: ${chat.id}`);

  return chat;
}

/**
 * Add a message to a chat
 */
export function addMessage(chatId: string, message: Message): boolean {
  try {
    const chats = loadChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);

    if (chatIndex === -1) {
      console.error(`[STORAGE] Chat not found: ${chatId}`);
      return false;
    }

    chats[chatIndex].messages.push(message);
    chats[chatIndex].updatedAt = new Date();

    saveChats(chats);

    console.info(`[STORAGE] Added message to chat ${chatId}`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error adding message:', error);
    return false;
  }
}

/**
 * Update a chat
 */
export function updateChat(chatId: string, updates: Partial<Chat>): boolean {
  try {
    const chats = loadChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);

    if (chatIndex === -1) {
      console.error(`[STORAGE] Chat not found: ${chatId}`);
      return false;
    }

    chats[chatIndex] = {
      ...chats[chatIndex],
      ...updates,
      updatedAt: new Date()
    };

    saveChats(chats);

    console.info(`[STORAGE] Updated chat ${chatId}`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error updating chat:', error);
    return false;
  }
}

/**
 * Delete a chat
 */
export function deleteChat(chatId: string): boolean {
  try {
    const chats = loadChats();
    const filtered = chats.filter(c => c.id !== chatId);

    if (filtered.length === chats.length) {
      console.warn(`[STORAGE] Chat not found: ${chatId}`);
      return false;
    }

    saveChats(filtered);

    console.info(`[STORAGE] Deleted chat ${chatId}`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error deleting chat:', error);
    return false;
  }
}

/**
 * Get a specific chat by ID
 */
export function getChat(chatId: string): Chat | null {
  try {
    const chats = loadChats();
    const chat = chats.find(c => c.id === chatId);

    if (!chat) {
      console.warn(`[STORAGE] Chat not found: ${chatId}`);
      return null;
    }

    return chat;

  } catch (error) {
    console.error('[STORAGE] Error getting chat:', error);
    return null;
  }
}

/**
 * Save current document to localStorage
 */
export function saveDocument(document: Document): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('[STORAGE] localStorage not available');
      return false;
    }

    const stored = localStorage.getItem(DOCUMENT_STORAGE_KEY);
    const documents: Record<string, Document> = stored ? JSON.parse(stored) : {};

    documents[document.id] = document;

    localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(documents));

    console.info(`[STORAGE] Saved document ${document.id}`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error saving document:', error);
    return false;
  }
}

/**
 * Load a document by ID
 */
export function loadDocument(documentId: string): Document | null {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('[STORAGE] localStorage not available');
      return null;
    }

    const stored = localStorage.getItem(DOCUMENT_STORAGE_KEY);

    if (!stored) {
      console.info('[STORAGE] No documents found in storage');
      return null;
    }

    const documents: Record<string, Document> = JSON.parse(stored);
    const document = documents[documentId];

    if (!document) {
      console.warn(`[STORAGE] Document not found: ${documentId}`);
      return null;
    }

    console.info(`[STORAGE] Loaded document ${documentId}`);

    return document;

  } catch (error) {
    console.error('[STORAGE] Error loading document:', error);
    return null;
  }
}

/**
 * Clear all storage (for debugging)
 */
export function clearAllStorage(): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DOCUMENT_STORAGE_KEY);
    localStorage.removeItem(EDIT_HISTORY_KEY);

    console.info('[STORAGE] Cleared all storage');

    return true;

  } catch (error) {
    console.error('[STORAGE] Error clearing storage:', error);
    return false;
  }
}

// ========== EDIT TRACKING SYSTEM ==========

/**
 * Save edit history for a document
 */
export function saveEditHistory(history: EditHistory): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('[STORAGE] localStorage not available');
      return false;
    }

    const stored = localStorage.getItem(EDIT_HISTORY_KEY);
    const histories: Record<string, EditHistory> = stored ? JSON.parse(stored) : {};

    histories[history.documentId] = history;

    localStorage.setItem(EDIT_HISTORY_KEY, JSON.stringify(histories));

    console.info(`[STORAGE] Saved edit history for document ${history.documentId} (${history.edits.length} edits)`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error saving edit history:', error);
    return false;
  }
}

/**
 * Load edit history for a document
 */
export function loadEditHistory(documentId: string): EditHistory | null {
  try {
    if (!isLocalStorageAvailable()) {
      return null;
    }

    const stored = localStorage.getItem(EDIT_HISTORY_KEY);

    if (!stored) {
      return { documentId, edits: [] };
    }

    const histories: Record<string, EditHistory> = JSON.parse(stored);
    const history = histories[documentId];

    if (!history) {
      return { documentId, edits: [] };
    }

    // Convert date strings back to Date objects
    history.edits.forEach(edit => {
      edit.timestamp = new Date(edit.timestamp);
    });

    console.info(`[STORAGE] Loaded edit history for document ${documentId} (${history.edits.length} edits)`);

    return history;

  } catch (error) {
    console.error('[STORAGE] Error loading edit history:', error);
    return { documentId, edits: [] };
  }
}

// ========== INDEXEDDB FOR ORIGINAL FILES ==========

/**
 * Open IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXEDDB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(ORIGINAL_FILES_STORE)) {
        const store = db.createObjectStore(ORIGINAL_FILES_STORE, { keyPath: 'documentId' });
        store.createIndex('fileName', 'fileName', { unique: false });
        console.info('[STORAGE] Created IndexedDB object store for original files');
      }
    };
  });
}

/**
 * Save original file to IndexedDB
 */
export async function saveOriginalFile(original: OriginalDocument): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction([ORIGINAL_FILES_STORE], 'readwrite');
    const store = transaction.objectStore(ORIGINAL_FILES_STORE);

    await new Promise((resolve, reject) => {
      const request = store.put(original);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });

    console.info(`[STORAGE] Saved original file ${original.documentId} (${original.fileName})`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error saving original file:', error);
    return false;
  }
}

/**
 * Load original file from IndexedDB
 */
export async function loadOriginalFile(documentId: string): Promise<OriginalDocument | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([ORIGINAL_FILES_STORE], 'readonly');
    const store = transaction.objectStore(ORIGINAL_FILES_STORE);

    const original = await new Promise<OriginalDocument | null>((resolve, reject) => {
      const request = store.get(documentId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (original) {
      console.info(`[STORAGE] Loaded original file ${documentId}`);
    } else {
      console.warn(`[STORAGE] Original file not found: ${documentId}`);
    }

    return original;

  } catch (error) {
    console.error('[STORAGE] Error loading original file:', error);
    return null;
  }
}

/**
 * Delete original file from IndexedDB
 */
export async function deleteOriginalFile(documentId: string): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction([ORIGINAL_FILES_STORE], 'readwrite');
    const store = transaction.objectStore(ORIGINAL_FILES_STORE);

    await new Promise((resolve, reject) => {
      const request = store.delete(documentId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });

    console.info(`[STORAGE] Deleted original file ${documentId}`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error deleting original file:', error);
    return false;
  }
}

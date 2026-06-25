/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Session metadata for organization
 */
export interface SessionMetadata {
  conversation_id?: string | null; // Active conversation ID for RAG queries
  embedding_model?: string; // Embedding model used
  embedding_dimension?: number; // Embedding vector dimension
  provider_id?: string; // AI provider identifier
  [key: string]: any; // Allow custom metadata fields
}

/**
 * Notebook session with vector database
 * session_id is the Llama Stack vector store ID
 */
export interface NotebookSession {
  session_id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  metadata?: SessionMetadata;
  document_count?: number;
}

/**
 * Document within a session
 */
export interface SessionDocument {
  document_id: string;
  source_type: 'text' | 'pdf' | 'md' | 'json' | 'yaml' | 'log';
  created_at: string;
  updated_at: string;
}

/**
 * API Response types
 */
export interface SessionResponse {
  status: 'success' | 'error';
  session?: NotebookSession;
  message?: string;
  error?: string;
}

export interface SessionListResponse {
  status: 'success' | 'error';
  sessions?: NotebookSession[];
  count?: number;
  error?: string;
}

export interface DocumentResponse {
  status: 'success' | 'error';
  document_id?: string;
  title?: string;
  session_id?: string;
  replaced?: boolean;
  message?: string;
  error?: string;
}

export interface DocumentListResponse {
  status: 'success' | 'error';
  session_id?: string;
  documents?: SessionDocument[];
  count?: number;
  error?: string;
}

export interface QueryResponse {
  status: 'success' | 'error';
  chunks?: any[];
  error?: string;
}

export interface UpsertResult {
  document_id: string;
  file_id: string;
  replaced: boolean;
  status: 'completed' | 'in_progress' | 'failed' | 'cancelled';
}

/**
 * Response factory functions
 */

/**
 * Create a successful session response
 * @param session - Notebook session object
 * @param message - Success message
 * @returns Session response object
 */
export const createSessionResponse = (
  session: NotebookSession,
  message: string,
): SessionResponse => {
  return {
    status: 'success',
    session,
    message,
  };
};

/**
 * Create a successful session list response
 * @param sessions - Array of notebook sessions
 * @returns Session list response object
 */
export const createSessionListResponse = (
  sessions: NotebookSession[],
): SessionListResponse => {
  return {
    status: 'success',
    sessions,
    count: sessions.length,
  };
};

/**
 * Create a successful document response
 * @param document_id - Document identifier
 * @param session_id - Session identifier
 * @param message - Success message
 * @param options - Optional fields (title, replaced)
 * @returns Document response object
 */
export const createDocumentResponse = (
  document_id: string,
  session_id: string,
  message: string,
  options?: {
    title?: string;
    replaced?: boolean;
  },
): DocumentResponse => {
  return {
    status: 'success',
    document_id,
    title: options?.title,
    session_id,
    replaced: options?.replaced,
    message,
  };
};

/**
 * Create a successful document list response
 * @param session_id - Session identifier
 * @param documents - Array of session documents
 * @returns Document list response object
 */
export const createDocumentListResponse = (
  session_id: string,
  documents: SessionDocument[],
): DocumentListResponse => {
  return {
    status: 'success',
    session_id,
    documents,
    count: documents.length,
  };
};

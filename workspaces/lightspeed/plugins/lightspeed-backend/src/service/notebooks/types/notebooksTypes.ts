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
  document_ids?: string[]; // Track documents in this session
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
}

/**
 * Document within a session
 */
export interface SessionDocument {
  document_id: string;
  title: string;
  session_id: string;
  user_id: string;
  source_type: 'text' | 'pdf' | 'url' | 'md' | 'json' | 'yaml' | 'log';
  created_at: string;
  metadata?: Record<string, any>;
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

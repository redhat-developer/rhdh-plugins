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

import type { Message } from '../types';

interface ExportedMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agentName?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    serverLabel?: string;
    arguments?: string;
    output?: string;
    error?: string;
  }>;
  ragSources?: Array<{ filename: string; text?: string; score?: number }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  reasoning?: string;
}

interface ExportedConversation {
  exportedAt: string;
  sessionId?: string;
  messageCount: number;
  messages: ExportedMessage[];
}

function serializeMessage(msg: Message): ExportedMessage {
  const exported: ExportedMessage = {
    role: msg.isUser ? 'user' : 'assistant',
    content: msg.text,
    timestamp: msg.timestamp.toISOString(),
  };
  if (msg.agentName) exported.agentName = msg.agentName;
  if (msg.toolCalls?.length) {
    exported.toolCalls = msg.toolCalls.map(tc => ({
      id: tc.id,
      name: tc.name,
      serverLabel: tc.serverLabel,
      arguments: tc.arguments,
      output: tc.output,
      error: tc.error,
    }));
  }
  if (msg.ragSources?.length) {
    exported.ragSources = msg.ragSources.map(r => ({
      filename: r.filename,
      text: r.text,
      score: r.score,
    }));
  }
  if (msg.usage) {
    exported.usage = {
      input_tokens: msg.usage.input_tokens,
      output_tokens: msg.usage.output_tokens,
    };
  }
  if (msg.reasoning) exported.reasoning = msg.reasoning;
  return exported;
}

export function exportConversation(
  messages: Message[],
  sessionId?: string,
): void {
  const data: ExportedConversation = {
    exportedAt: new Date().toISOString(),
    sessionId,
    messageCount: messages.length,
    messages: messages.map(serializeMessage),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `conversation-${sessionId || 'export'}-${Date.now()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

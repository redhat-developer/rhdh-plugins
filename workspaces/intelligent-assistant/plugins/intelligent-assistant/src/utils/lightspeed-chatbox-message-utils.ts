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
 * Pure message helpers with no PatternFly CSS side effects.
 *
 * Kept separate from `lightspeed-chatbox-utils.tsx` so
 * `NotebookStreamProvider` (always mounted under the FAB drawer provider)
 * does not pull chatbot / react-core styles into the critical FAB graph.
 */

import type { SourcesCardProps } from '@patternfly/chatbot';

import type {
  BaseMessage,
  LCSConversation,
  ReferencedDocument,
  ReferencedDocuments,
  ToolCall,
} from '../types';

export type SourceWithRagId = SourcesCardProps['sources'][number] & {
  /** Full LCORE RAG source id for chip-modal labels. */
  ragSource?: string;
};

type MessageProps = {
  content: string;
  timestamp: string;
  name?: string;
  avatar?: string | any;
  isLoading?: boolean;
  error?: {
    title: string;
  };
  sources?: SourcesCardProps;
  toolCalls?: ToolCall[];
};

export const getTimestampVariablesString = (v: number) => {
  if (v < 10) {
    return `0${v}`;
  }
  return `${v}`;
};

const isBlankLine = (line: string) => !line.trim();

/** Ordered list item at line start (CommonMark), ignoring leading spaces. */
const isOrderedListLine = (line: string) => /^\s*\d+\.\s/.test(line);

/** ASCII bullets; also U+2022 (•) — not a CommonMark marker, but users paste it as a list. */
const isBulletListLine = (line: string) =>
  /^\s*[-*+]\s/.test(line) || /^\s*\u2022(?:\s+|\S|$)/u.test(line);

const escapeBulletListMarker = (line: string) => {
  if (/^\s*\u2022/u.test(line)) {
    return line;
  }
  return line.replace(/^(\s*)([*+-])(\s)/, '$1\\$2$3');
};

const escapeOrderedListMarker = (line: string) =>
  line.replace(/^(\s*)(\d+)\.(\s)/, '$1$2\\.$3');

/**
 * When intro lines (no blank lines among them) are followed by a contiguous run of
 * list lines, join intro + list into one Markdown paragraph using hard breaks and
 * per-line escaping so the block does not split awkwardly in the chat UI.
 */
const foldListWithIntro = (
  s: string,
  isListItemLine: (line: string) => boolean,
  escapeListLine: (line: string) => string,
): string => {
  const lines = s.split('\n');
  let firstListIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined && isListItemLine(line)) {
      firstListIdx = i;
      break;
    }
  }
  if (firstListIdx < 0) {
    return s;
  }

  const intro = lines.slice(0, firstListIdx);
  if (intro.some(isBlankLine)) {
    return s;
  }

  const rest = lines.slice(firstListIdx);
  const restItems = rest.filter(l => !isBlankLine(l));
  if (restItems.length === 0 || !restItems.every(isListItemLine)) {
    return s;
  }

  const escaped = restItems.map(escapeListLine);
  if (intro.length === 0) {
    return escaped.join('  \n');
  }
  return `${intro.join('  \n')}  \n${escaped.join('  \n')}`;
};

const foldOrderedListWithIntro = (s: string) =>
  foldListWithIntro(s, isOrderedListLine, escapeOrderedListMarker);

const foldBulletListWithIntro = (s: string) =>
  foldListWithIntro(s, isBulletListLine, escapeBulletListMarker);

/**
 * Trims user chat input and reduces blank lines that split Markdown blocks
 * (e.g. paragraph + blank line + ordered list) so PatternFly renders one user bubble.
 */
export const normalizeChatUserInput = (input: string): string => {
  let s = input.replace(/\r\n/g, '\n').trim();
  if (!s) {
    return s;
  }
  s = s.replace(/\n{3,}/g, '\n\n');
  s = s.replace(/\n\n(?=\s*\d+\.\s)/gm, '\n');
  s = s.replace(/\n\n(?=\s*[-*+]\s)/gm, '\n');
  s = s.replace(/\n\n(?=\s*\u2022)/gm, '\n');
  s = foldOrderedListWithIntro(s);
  s = foldBulletListWithIntro(s);
  return s.trim();
};

export const getTimestamp = (unix_timestamp: number) => {
  if (typeof unix_timestamp !== 'number' || Number.isNaN(unix_timestamp)) {
    // eslint-disable-next-line no-console
    console.error('Invalid Unix timestamp provided');
    return '';
  }

  const a = new Date(unix_timestamp);
  const month = getTimestampVariablesString(a.getMonth() + 1);
  const year = a.getFullYear();
  const date = getTimestampVariablesString(a.getDate());
  const hour = getTimestampVariablesString(a.getHours());
  const min = getTimestampVariablesString(a.getMinutes());
  const sec = getTimestampVariablesString(a.getSeconds());
  const time = `${date}/${month}/${year}, ${hour}:${min}:${sec}`;
  return time;
};

export const createMessage = ({
  role,
  name,
  avatar,
  isLoading = false,
  content,
  timestamp,
  error,
  sources,
  toolCalls,
  defaultUserName = 'Guest',
}: MessageProps & { role: 'user' | 'bot'; defaultUserName?: string }) => ({
  role,
  name: name || defaultUserName,
  avatar,
  isLoading,
  content,
  timestamp,
  error,
  sources,
  toolCalls,
});

export const createUserMessage = (
  props: MessageProps & { defaultUserName?: string },
) =>
  createMessage({
    ...props,
    role: 'user',
    defaultUserName: props.defaultUserName,
  });

export const createBotMessage = (props: MessageProps) =>
  createMessage({
    ...props,
    role: 'bot',
  });

export const getConversationsData = (
  conversation: LCSConversation,
): [BaseMessage, BaseMessage] => {
  const [userMessage, botMessage] = conversation.messages || [];
  return [
    {
      ...userMessage,
      timestamp: getTimestamp(
        conversation.started_at
          ? new Date(conversation.started_at).getTime()
          : Date.now(),
      ),
    },
    {
      ...botMessage,
      timestamp: getTimestamp(
        conversation.completed_at
          ? new Date(conversation.completed_at).getTime()
          : Date.now(),
      ),
      referenced_documents: botMessage?.referenced_documents ?? [],
    },
  ];
};

/**
 * Maps LCORE referenced documents to chatbot sources.
 * UI (SourcesChipModal) renders RagSourceLabel from `ragSource`; keep this
 * free of JSX so the notebook stream store stays CSS-clean.
 */
export const transformDocumentsToSources = (
  referenced_documents: ReferencedDocuments,
): SourcesCardProps | undefined => {
  if (!referenced_documents || referenced_documents?.length === 0) {
    return undefined;
  }
  return {
    sources: referenced_documents.map(
      (doc: ReferencedDocument): SourceWithRagId => ({
        body: doc.doc_description,
        title: doc.doc_title,
        link: doc?.doc_url,
        isExternal: !!doc?.doc_url,
        ...(doc.source
          ? {
              ragSource: doc.source,
            }
          : {}),
      }),
    ),
  };
};

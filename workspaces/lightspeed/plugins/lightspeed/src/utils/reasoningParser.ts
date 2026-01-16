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
 * Parses a message content to extract redacted reasoning and main content.
 * Messages from models with deep thinking support may contain:
 * <think>Some reasoning...</think>Main response
 *
 * @param content - The message content that may contain reasoning tags
 * @returns An object with the extracted reasoning and cleaned main content
 */
export interface ParsedReasoning {
  reasoning: string | null;
  mainContent: string;
  hasReasoning: boolean;
  isReasoningInProgress: boolean;
}

export const isReasoningInProgress = (content: string): boolean => {
  if (!content) return false;

  const hasOpeningTag = content.includes('<think>');
  const hasClosingTag = content.includes('</think>');

  return hasOpeningTag && !hasClosingTag;
};

export const parseReasoning = (content: string): ParsedReasoning => {
  if (!content) {
    return {
      reasoning: null,
      mainContent: content,
      hasReasoning: false,
      isReasoningInProgress: false,
    };
  }

  const reasoningInProgress = isReasoningInProgress(content);

  const reasoningPattern = /<think>(.*?)<\/think>/s;
  const match = content.match(reasoningPattern);

  if (match) {
    const reasoning = (match[1] || '').trim();
    const mainContent = content.replace(reasoningPattern, '').trim();

    return {
      reasoning,
      mainContent,
      hasReasoning: true,
      isReasoningInProgress: false,
    };
  }

  if (reasoningInProgress) {
    return {
      reasoning: null,
      mainContent: '',
      hasReasoning: false,
      isReasoningInProgress: true,
    };
  }

  return {
    reasoning: null,
    mainContent: content,
    hasReasoning: false,
    isReasoningInProgress: false,
  };
};

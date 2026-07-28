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

export const parseReasoning = (content: string): ParsedReasoning => {
  if (!content) {
    return {
      reasoning: null,
      mainContent: content,
      hasReasoning: false,
      isReasoningInProgress: false,
    };
  }

  const lastOpenIndex = content.lastIndexOf('<think>');
  const lastCloseIndex = content.lastIndexOf('</think>');

  const isReasoningInProgress =
    lastOpenIndex !== -1 && lastOpenIndex > lastCloseIndex;

  const reasoningPattern = /<think>(.*?)<\/think>/gs;
  const matches = Array.from(content.matchAll(reasoningPattern));

  const extractedReasoning = matches
    .map(m => (m[1] || '').trim())
    .filter(reasoning => reasoning.length > 0);

  if (isReasoningInProgress && lastOpenIndex !== -1) {
    const partial = content.substring(lastOpenIndex + '<think>'.length).trim();
    if (partial.length > 0) {
      extractedReasoning.push(partial);
    }
  }

  const mainContent = content.replaceAll(reasoningPattern, '').trim();

  const hasValidReasoning = extractedReasoning.length > 0;

  return {
    reasoning: hasValidReasoning ? extractedReasoning.join('\n\n') : null,
    mainContent: isReasoningInProgress ? '' : mainContent,
    hasReasoning: hasValidReasoning,
    isReasoningInProgress: isReasoningInProgress,
  };
};

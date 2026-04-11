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
 * Extracts a short preview from the first non-empty line of text,
 * truncating to `maxLen` characters with an ellipsis if needed.
 */
export function getPreviewSnippet(text: string, maxLen = 80): string {
  const firstLine = text.split('\n').find(l => l.trim()) || '';
  if (firstLine.length <= maxLen) return firstLine;
  return `${firstLine.slice(0, maxLen)}\u2026`;
}

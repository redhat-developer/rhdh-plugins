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
 * Strip triple-backtick wrappers when the LLM wraps its entire response
 * in a fenced code block.  Handles optional language tags and leading/trailing
 * whitespace.
 *
 * Examples that are stripped:
 *   ```\nHello **world**\n- item 1\n```
 *   ```markdown\n# Title\nSome text\n```
 *
 * Only strips when:
 * - The backticks wrap the ENTIRE response (not partial blocks)
 * - The body contains markdown formatting (bold, lists, headings),
 *   indicating the model wrapped prose — not actual code
 */
export function stripWrappingCodeFences(text: string): string {
  if (!text) return text;

  const trimmed = text.trim();

  // Pure string parsing to avoid any regex backtracking
  if (!trimmed.startsWith('```')) return text;

  const firstNewline = trimmed.indexOf('\n');
  if (firstNewline === -1) return text;

  // Extract the language tag from the opening fence line (e.g., "```typescript")
  const openingLine = trimmed.slice(3, firstNewline).trim();
  if (openingLine.length > 20) return text;
  if (openingLine && !/^\w+$/.test(openingLine)) return text;

  const closeIdx = trimmed.lastIndexOf('\n```');
  if (closeIdx <= firstNewline) return text;

  // Verify nothing follows the closing fence except whitespace
  const afterClose = trimmed.slice(closeIdx + 4).trim();
  if (afterClose.length > 0) return text;

  const lang = openingLine.toLowerCase();
  const body = trimmed.slice(firstNewline + 1, closeIdx);

  // Only strip if the body doesn't contain its own fenced code blocks
  if (/^```/m.test(body)) return text;

  // If a specific programming language is given (not "markdown"/"text"/empty),
  // assume the fences are intentional
  const proseLanguages = new Set(['markdown', 'md', 'text', 'txt', '']);
  if (lang && !proseLanguages.has(lang)) {
    // Even with a code language, strip if the body clearly contains markdown
    // prose (headings, bold, bullet lists)
    const hasMarkdown =
      /\*\*[^*]+\*\*/.test(body) ||
      /^#{1,6}\s/m.test(body) ||
      /^[-*+]\s/m.test(body);
    if (!hasMarkdown) return text;
  }

  return body;
}

/**
 * Sanitize LLM response text to remove internal file reference tokens
 * These tokens look like <|file-3bf6634762184a15900d7d568264430a|> and should not be shown to users
 *
 * @param text - The raw text from the LLM response
 * @returns Sanitized text with internal tokens removed
 */
export function sanitizeResponseText(text: string): string {
  if (!text) return text ?? '';

  let sanitized = text;

  // Remove file reference tokens: <|file-hexstring|>
  // Use {1,64} to limit hex length and avoid backtracking (S5852)
  sanitized = sanitized.replace(/<\|file-[a-f0-9]{1,64}\|>/gi, '');

  // Smaller models sometimes emit tool invocations as plain text instead of
  // structured tool_call events.  Strip all common patterns:
  //   [Execute rag_search tool with query "what is a dog"]
  //   [Execute meadow_tool]
  //   [Execute knowledge_search]
  sanitized = sanitized.replace(/\[Execute\s+[^\]]{1,500}\]\n{0,5}/gi, '');

  // [rag_search(query="...")]  or  [some_tool()]
  sanitized = sanitized.replace(/\[\w+\([^\)]*\)\]\n*/g, '');

  // Standalone tool-name brackets that follow common naming conventions
  // e.g. [rag_search]  [meadow_tool]  [knowledge_base_search]
  // but NOT markdown links [text](url) or footnotes [1]
  // Bounded quantifiers to avoid nested quantifier backtracking (S5852)
  sanitized = sanitized.replace(
    /\[\w{1,50}_\w{1,50}(?:_\w{1,50}){0,20}\]\n{0,5}/g,
    '',
  );

  // Strip wrapping code fences when the model wraps its entire response
  sanitized = stripWrappingCodeFences(sanitized);

  return sanitized.trimStart();
}

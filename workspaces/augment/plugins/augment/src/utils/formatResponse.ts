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
 * Detect whether the text already contains markdown formatting.
 * When the model outputs well-formed markdown, the formatting heuristics
 * below should be skipped to avoid corrupting the output.
 */
function hasMarkdownFormatting(text: string): boolean {
  const markers = [
    /^#{1,6}\s/m, // headings
    /\*\*[^*]+\*\*/m, // bold
    /^[-*+]\s/m, // unordered lists
    /^\d+\.\s/m, // ordered lists
    /^>/m, // blockquotes
    /\|.*\|.*\|/m, // tables
    /^```/m, // fenced code blocks
  ];
  let hits = 0;
  for (const re of markers) {
    if (re.test(text)) hits++;
    if (hits >= 2) return true;
  }
  return false;
}

/**
 * Formats response text for better readability.
 * Detects common patterns and converts them to markdown.
 *
 * Skips all heuristics when the text already contains markdown formatting
 * to avoid corrupting well-formed model output.
 *
 * @param text - The input text to format
 * @returns Formatted text with markdown
 */
export function formatResponseText(text: string): string {
  if (!text) return text;

  // If the model already produced markdown, don't apply heuristics
  if (hasMarkdownFormatting(text)) return text;

  let formatted = text;

  // Pattern 0: Detect log-like content (lines starting with timestamps, log levels, or controller output)
  const logLinePattern =
    /^[IWE]\d{4}\s|\^\d{4}-\d{2}-\d{2}|\[\w+\].*\d{2}:\d{2}:\d{2}|reflector\.go:\d+|controller\.go:\d+/;
  const lines = formatted.split('\n');
  let consecutiveLogLines = 0;
  let logStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (logLinePattern.test(lines[i])) {
      if (consecutiveLogLines === 0) logStartIndex = i;
      consecutiveLogLines++;
    } else if (consecutiveLogLines >= 3) {
      const logBlock = lines.slice(logStartIndex, i).join('\n');
      const before = lines.slice(0, logStartIndex).join('\n');
      const after = lines.slice(i).join('\n');
      formatted = `${before}\n\n\`\`\`text\n${logBlock}\n\`\`\`\n\n${after}`;
      break;
    } else {
      consecutiveLogLines = 0;
      logStartIndex = -1;
    }
  }

  if (consecutiveLogLines >= 3 && logStartIndex >= 0) {
    const logBlock = lines.slice(logStartIndex).join('\n');
    const before = lines.slice(0, logStartIndex).join('\n');
    formatted = `${before}\n\n\`\`\`text\n${logBlock}\n\`\`\``;
  }

  // Pattern 1: Long comma-separated lists (more than 5 items)
  formatted = formatted.replace(
    /^([^:\n]+:\s*)?([a-zA-Z0-9_-]+(?:,\s*[a-zA-Z0-9_-]+){5,})\.?$/gm,
    (_match, prefix, items) => {
      const itemList = items
        .split(/,\s*/)
        .map((item: string) => `- ${item.trim()}`)
        .join('\n');
      return prefix ? `${prefix}\n\n${itemList}` : itemList;
    },
  );

  // Pattern 2: Detect single-line JSON objects/arrays and format as code blocks.
  // Restricted to single-line matches to avoid false positives on multi-line
  // prose that happens to contain brackets.
  formatted = formatted.replace(
    /(?<![`])(\{[^\n]*\}|\[[^\n]*\])(?![`])/g,
    match => {
      const trimmed = match.trim();
      if (trimmed === '[]' || trimmed === '{}' || trimmed.length < 5) {
        return match;
      }

      try {
        const parsed = JSON.parse(match);

        if (Array.isArray(parsed) && parsed.length === 0) return match;
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          Object.keys(parsed).length === 0
        ) {
          return match;
        }

        const prettyJson = JSON.stringify(parsed, null, 2);
        return `\n\`\`\`json\n${prettyJson}\n\`\`\`\n`;
      } catch {
        return match;
      }
    },
  );

  // Pattern 3: Detect key: value pairs and format as a list.
  // Only match lines that are purely "word: value" — skip lines that
  // already start with markdown formatting (-, *, #, >, |, **).
  const keyValuePattern = /^(?![#>|*-])(\w+):\s+(.+)$/gm;
  let keyValueMatches = 0;
  formatted.replace(keyValuePattern, () => {
    keyValueMatches++;
    return '';
  });
  if (keyValueMatches >= 3) {
    formatted = formatted.replace(keyValuePattern, '- **$1:** $2');
  }

  return formatted;
}

/**
 * Formats tool output for display.
 * Handles JSON, lists, and other structured data.
 *
 * @param output - The tool output string
 * @returns Formatted output
 */
export function formatToolOutput(output: string): string {
  if (!output) return output;

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(output);

    // If it's an array of simple strings, format as bullet list
    if (
      Array.isArray(parsed) &&
      parsed.every(item => typeof item === 'string')
    ) {
      if (parsed.length > 10) {
        // For very long lists, show count and first/last few
        const first = parsed
          .slice(0, 5)
          .map(item => `- ${item}`)
          .join('\n');
        const last = parsed
          .slice(-3)
          .map(item => `- ${item}`)
          .join('\n');
        return `${first}\n- ... *(${parsed.length - 8} more items)*\n${last}`;
      }
      return parsed.map(item => `- ${item}`).join('\n');
    }

    // If it's an array of objects, try to format as table
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === 'object'
    ) {
      const keys = Object.keys(parsed[0]);
      if (keys.length <= 5) {
        // Format as markdown table
        const header = `| ${keys.join(' | ')} |`;
        const separator = `| ${keys.map(() => '---').join(' | ')} |`;
        const rows = parsed
          .slice(0, 20)
          .map(row => `| ${keys.map(k => String(row[k] ?? '')).join(' | ')} |`)
          .join('\n');
        const result = `${header}\n${separator}\n${rows}`;
        if (parsed.length > 20) {
          return `${result}\n\n*... and ${parsed.length - 20} more rows*`;
        }
        return result;
      }
    }

    // Otherwise, pretty print the JSON
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Not JSON, try other patterns
  }

  // Check for comma-separated list
  const items = output.split(/,\s*/);
  if (items.length > 5 && items.every(item => item.length < 100)) {
    return items.map(item => `- ${item.trim()}`).join('\n');
  }

  return output;
}

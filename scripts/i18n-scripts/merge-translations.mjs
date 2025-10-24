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

import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const tsPath = args.get('--ts');
const jsonPath = args.get('--json');
const outPath = args.get('--out');
const language = args.get('--language');

if (!tsPath || !jsonPath || !outPath || !language) {
  console.error(
    'Usage: node merge-translations.mjs --ts <path/to/ref.ts> --json <path/to/ref-lang.json> --out <path/to/lang.ts> --language <lang>',
  );
  process.exit(1);
}

try {
  // Read the existing language TypeScript file (e.g., fr.ts)
  let tsContent;
  if (fs.existsSync(outPath)) {
    // Use existing language file as base
    tsContent = fs.readFileSync(outPath, 'utf8');
    console.log(
      `Updating existing ${language} file: ${path.basename(outPath)}`,
    );
  } else {
    console.error(`Target file does not exist: ${outPath}`);
    console.error(
      'Please ensure the target language file exists before running the merge.',
    );
    process.exit(1);
  }

  // Read the translation JSON file
  const jsonContent = fs.readFileSync(jsonPath, 'utf8');
  const jsonMessages = JSON.parse(jsonContent);

  // Find the messages object in the TypeScript file
  const messagesStartMatch = tsContent.match(/(messages:\s*{)/);
  if (!messagesStartMatch) {
    console.error('Could not find messages object start in TypeScript file');
    process.exit(1);
  }

  const beforeMessages = messagesStartMatch[1];
  const startIndex = messagesStartMatch.index + messagesStartMatch[0].length;

  // Find the matching closing brace by counting braces
  let braceCount = 1;
  let endIndex = startIndex;
  let inString = false;
  let stringChar = '';
  let escaped = false;

  for (let i = startIndex; i < tsContent.length && braceCount > 0; i++) {
    const char = tsContent[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (inString) {
      if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    } else {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
      } else if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
    }

    endIndex = i;
  }

  if (braceCount !== 0) {
    console.error('Could not find matching closing brace for messages object');
    process.exit(1);
  }

  const afterMessages = '}';
  const fullMessagesMatch = tsContent.substring(
    messagesStartMatch.index,
    endIndex + 1,
  );

  // Extract existing keys and values from the current TypeScript file
  const existingTranslations = {};
  const existingMessagesMatch = tsContent.match(/messages:\s*{([\s\S]*?)}/);
  if (existingMessagesMatch) {
    const messagesContent = existingMessagesMatch[1];
    const keyValueRegex = new RegExp("'([^']+)':\\s*['\"]([^'\"]*)['\"]", 'g');
    let match = keyValueRegex.exec(messagesContent);
    while (match !== null) {
      existingTranslations[match[1]] = match[2];
      match = keyValueRegex.exec(messagesContent);
    }
  }

  // Build new messages content - preserve existing keys, update/add from JSON
  const newMessagesLines = [];
  const allKeys = [
    ...new Set([
      ...Object.keys(existingTranslations),
      ...Object.keys(jsonMessages),
    ]),
  ].sort();

  let updatedCount = 0;
  for (const key of allKeys) {
    // Use value from JSON if available, otherwise keep existing value
    const value = jsonMessages[key] || existingTranslations[key] || '';

    // Validate the key and value
    if (typeof key !== 'string' || typeof value !== 'string') {
      console.error(`Invalid key-value pair: ${key} = ${value}`);
      continue;
    }

    // Check for problematic characters that might cause issues
    const hasControlChars = str => {
      for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (
          (charCode >= 0 && charCode <= 8) ||
          charCode === 11 ||
          charCode === 12 ||
          (charCode >= 14 && charCode <= 31) ||
          charCode === 127
        ) {
          return true;
        }
      }
      return false;
    };
    if (hasControlChars(value)) {
      console.warn(
        `Warning: Translation for '${key}' contains control characters that may cause issues`,
      );
    }

    // Unify apostrophes to standard apostrophe (universal approach)
    // This catches all Unicode apostrophe variants and converts them to standard apostrophe
    const unifiedValue = value
      // Replace various Unicode apostrophe characters with standard apostrophe
      // This covers: straight apostrophe, curly apostrophe, backtick, acute accent, and other variants
      .replace(/[''`´]/g, "'"); // All common apostrophe variants

    // Properly escape special characters for JavaScript strings
    let escapedValue;
    const hasDoubleQuotes = unifiedValue.includes('"');
    const hasSingleQuotes = unifiedValue.includes("'");

    if (hasDoubleQuotes && !hasSingleQuotes) {
      // Use single quotes for strings with double quotes
      escapedValue = `'${unifiedValue.replace(/'/g, "\\'")}'`;
    } else if (hasSingleQuotes && !hasDoubleQuotes) {
      // Use double quotes for strings with single quotes
      escapedValue = `"${unifiedValue.replace(/"/g, '\\"')}"`;
    } else if (hasDoubleQuotes && hasSingleQuotes) {
      // Use single quotes for mixed quote types, escape single quotes with \'
      escapedValue = `'${unifiedValue.replace(/'/g, "\\'")}'`;
    } else {
      // No quotes to escape, use double quotes as default
      escapedValue = `"${unifiedValue}"`;
    }

    // Track if this is an update
    if (
      jsonMessages[key] &&
      existingTranslations[key] &&
      jsonMessages[key] !== existingTranslations[key]
    ) {
      updatedCount++;
      console.log(`  Updated: ${key} = "${value}"`);
    } else if (jsonMessages[key] && !existingTranslations[key]) {
      updatedCount++;
      console.log(`  Added: ${key} = "${value}"`);
    }

    // Format the line with proper indentation
    if (value.length > 60) {
      // Multi-line format for long strings
      newMessagesLines.push(`    '${key}':`);
      newMessagesLines.push(`      "${escapedValue}",`);
    } else {
      // Single line format
      newMessagesLines.push(`    '${key}': "${escapedValue}",`);
    }
  }

  // Construct the new content
  const newMessagesContent = newMessagesLines.join('\n');
  const newMessagesObject = `${beforeMessages}\n${newMessagesContent}\n  ${afterMessages}`;
  const newTsContent = tsContent.replace(fullMessagesMatch, newMessagesObject);

  // Write the updated TypeScript file
  fs.writeFileSync(outPath, newTsContent, 'utf8');

  console.log(
    `Successfully updated ${language} translations in ${path.basename(outPath)} (${updatedCount} values updated)`,
  );
} catch (error) {
  console.error('Error merging translations:', error.message);
  process.exit(1);
}

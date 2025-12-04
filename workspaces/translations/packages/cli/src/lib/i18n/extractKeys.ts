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

import * as ts from 'typescript';

export interface TranslationKey {
  key: string;
  value: string;
  context?: string;
  line: number;
  column: number;
}

/**
 * Extract translation keys from TypeScript/JavaScript source code
 */
export function extractTranslationKeys(
  content: string,
  filePath: string,
): Record<string, string> {
  const keys: Record<string, string> = {};

  try {
    // Parse the source code
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
    );

    // Extract from exported object literals (Backstage translation ref pattern)
    // Pattern: export const messages = { key: 'value', nested: { key: 'value' } }
    // Also handles type assertions: { ... } as any
    const extractFromObjectLiteral = (node: ts.Node, prefix = ''): void => {
      // Handle type assertions: { ... } as any
      let objectNode: ts.Node = node;
      if (ts.isAsExpression(node)) {
        objectNode = node.expression;
      }

      if (ts.isObjectLiteralExpression(objectNode)) {
        for (const property of objectNode.properties) {
          if (ts.isPropertyAssignment(property) && property.name) {
            let keyName = '';
            if (ts.isIdentifier(property.name)) {
              keyName = property.name.text;
            } else if (ts.isStringLiteral(property.name)) {
              keyName = property.name.text;
            }

            if (keyName) {
              const fullKey = prefix ? `${prefix}.${keyName}` : keyName;

              // Handle type assertions in property initializers too
              let initializer = property.initializer;
              if (ts.isAsExpression(initializer)) {
                initializer = initializer.expression;
              }

              if (ts.isStringLiteral(initializer)) {
                // Leaf node - this is a translation value
                keys[fullKey] = initializer.text;
              } else if (ts.isObjectLiteralExpression(initializer)) {
                // Nested object - recurse
                extractFromObjectLiteral(initializer, fullKey);
              }
            }
          }
        }
      }
    };

    // Visit all nodes in the AST
    const visit = (node: ts.Node) => {
      // Look for createTranslationRef calls with messages property
      // Pattern: createTranslationRef({ id: '...', messages: { key: 'value' } })
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'createTranslationRef'
      ) {
        const args = node.arguments;
        if (args.length > 0 && ts.isObjectLiteralExpression(args[0])) {
          // Find the 'messages' property in the object literal
          for (const property of args[0].properties) {
            if (
              ts.isPropertyAssignment(property) &&
              ts.isIdentifier(property.name) &&
              property.name.text === 'messages'
            ) {
              // Handle type assertions: { ... } as any
              let messagesNode = property.initializer;
              if (ts.isAsExpression(messagesNode)) {
                messagesNode = messagesNode.expression;
              }

              if (ts.isObjectLiteralExpression(messagesNode)) {
                // Extract keys from the messages object
                extractFromObjectLiteral(messagesNode);
              }
            }
          }
        }
      }

      // Look for createTranslationResource calls
      // Pattern: createTranslationResource({ ref: ..., translations: { ... } })
      // Note: Most files using this don't contain keys directly, but we check anyway
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'createTranslationResource'
      ) {
        const args = node.arguments;
        if (args.length > 0 && ts.isObjectLiteralExpression(args[0])) {
          // Look for any object literals in the arguments that might contain keys
          // Most createTranslationResource calls just set up imports, but check for direct keys
          for (const property of args[0].properties) {
            if (ts.isPropertyAssignment(property)) {
              // If there's a 'translations' property with an object literal, extract from it
              if (
                ts.isIdentifier(property.name) &&
                property.name.text === 'translations' &&
                ts.isObjectLiteralExpression(property.initializer)
              ) {
                extractFromObjectLiteral(property.initializer);
              }
            }
          }
        }
      }

      // Look for createTranslationMessages calls
      // Pattern: createTranslationMessages({ ref: ..., messages: { key: 'value' } })
      // Also handles: messages: { ... } as any
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'createTranslationMessages'
      ) {
        const args = node.arguments;
        if (args.length > 0 && ts.isObjectLiteralExpression(args[0])) {
          // Find the 'messages' property in the object literal
          for (const property of args[0].properties) {
            if (
              ts.isPropertyAssignment(property) &&
              ts.isIdentifier(property.name) &&
              property.name.text === 'messages'
            ) {
              // Handle type assertions: { ... } as any
              let messagesNode = property.initializer;
              if (ts.isAsExpression(messagesNode)) {
                messagesNode = messagesNode.expression;
              }

              if (ts.isObjectLiteralExpression(messagesNode)) {
                // Extract keys from the messages object
                extractFromObjectLiteral(messagesNode);
              }
            }
          }
        }
      }

      // Look for exported const declarations with object literals (Backstage pattern)
      // Pattern: export const messages = { ... }
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (
            declaration.initializer &&
            ts.isObjectLiteralExpression(declaration.initializer)
          ) {
            // Check if it's exported and has a name suggesting it's a messages object
            const isExported = node.modifiers?.some(
              m => m.kind === ts.SyntaxKind.ExportKeyword,
            );
            const varName = ts.isIdentifier(declaration.name)
              ? declaration.name.text
              : '';
            if (
              isExported &&
              (varName.includes('Messages') ||
                varName.includes('messages') ||
                varName.includes('translations'))
            ) {
              extractFromObjectLiteral(declaration.initializer);
            }
          }
        }
      }

      // Look for t() function calls
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 't'
      ) {
        const args = node.arguments;
        if (args.length > 0 && ts.isStringLiteral(args[0])) {
          const key = args[0].text;
          const value =
            args.length > 1 && ts.isStringLiteral(args[1]) ? args[1].text : key;
          keys[key] = value;
        }
      }

      // Look for i18n.t() method calls
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'i18n' &&
        ts.isIdentifier(node.expression.name) &&
        node.expression.name.text === 't'
      ) {
        const args = node.arguments;
        if (args.length > 0 && ts.isStringLiteral(args[0])) {
          const key = args[0].text;
          const value =
            args.length > 1 && ts.isStringLiteral(args[1]) ? args[1].text : key;
          keys[key] = value;
        }
      }

      // Look for useTranslation hook usage
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isCallExpression(node.expression.expression) &&
        ts.isIdentifier(node.expression.expression.expression) &&
        node.expression.expression.expression.text === 'useTranslation' &&
        ts.isIdentifier(node.expression.name) &&
        node.expression.name.text === 't'
      ) {
        const args = node.arguments;
        if (args.length > 0 && ts.isStringLiteral(args[0])) {
          const key = args[0].text;
          const value =
            args.length > 1 && ts.isStringLiteral(args[1]) ? args[1].text : key;
          keys[key] = value;
        }
      }

      // Look for translation key patterns in JSX
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = ts.isJsxElement(node)
          ? node.openingElement.tagName
          : node.tagName;
        if (ts.isIdentifier(tagName) && tagName.text === 'Trans') {
          // Handle react-i18next Trans component
          const attributes = ts.isJsxElement(node)
            ? node.openingElement.attributes
            : node.attributes;
          if (ts.isJsxAttributes(attributes)) {
            attributes.properties.forEach((attr: any) => {
              if (
                ts.isJsxAttribute(attr) &&
                ts.isIdentifier(attr.name) &&
                attr.name.text === 'i18nKey' &&
                attr.initializer &&
                ts.isStringLiteral(attr.initializer)
              ) {
                const key = attr.initializer.text;
                keys[key] = key; // Default value is the key itself
              }
            });
          }
        }
      }

      // Recursively visit child nodes
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  } catch {
    // If TypeScript parsing fails, fall back to regex-based extraction
    return extractKeysWithRegex(content);
  }

  return keys;
}

/**
 * Fallback regex-based key extraction for non-TypeScript files
 */
function extractKeysWithRegex(content: string): Record<string, string> {
  const keys: Record<string, string> = {};

  // Common patterns for translation keys
  // Note: createTranslationMessages pattern is handled by AST parser above
  // This regex fallback is for non-TypeScript files or when AST parsing fails
  const patterns = [
    // t('key', 'value')
    /t\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*['"`]([^'"`]*)['"`])?\s*\)/g,
    // i18n.t('key', 'value')
    /i18n\s*\.\s*t\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*['"`]([^'"`]*)['"`])?\s*\)/g,
    // useTranslation().t('key', 'value')
    /useTranslation\s*\(\s*\)\s*\.\s*t\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*['"`]([^'"`]*)['"`])?\s*\)/g,
    // Trans i18nKey="key"
    /i18nKey\s*=\s*['"`]([^'"`]+)['"`]/g,
  ];

  for (const pattern of patterns) {
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      const value = match[2] || key;
      keys[key] = value;
    }
  }

  return keys;
}

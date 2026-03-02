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

export interface ExtractResult {
  keys: Record<string, string>;
  pluginId: string | null;
}

/**
 * Extract translation keys from TypeScript/JavaScript source code
 */
export function extractTranslationKeys(
  content: string,
  filePath: string,
): ExtractResult {
  const keys: Record<string, string> = {};
  let pluginId: string | null = null;

  // For .d.ts files, use regex extraction as they have declaration syntax
  // that's harder to parse with AST
  if (filePath.endsWith('.d.ts')) {
    return { keys: extractKeysWithRegex(content), pluginId: null };
  }

  try {
    // Parse the source code
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
    );

    // Track invalid keys for warning
    const invalidKeys: string[] = [];

    // Extract from exported object literals (Backstage translation ref pattern)
    // Pattern: export const messages = { key: 'value', nested: { key: 'value' } }
    // Also handles type assertions: { ... } as any

    /**
     * Unwrap type assertion expressions (e.g., { ... } as any)
     */
    const unwrapTypeAssertion = (node: ts.Node): ts.Node => {
      return ts.isAsExpression(node) ? node.expression : node;
    };

    /**
     * Extract key name from property name (identifier or string literal)
     */
    const extractPropertyKeyName = (
      propertyName: ts.PropertyName,
    ): string | null => {
      if (ts.isIdentifier(propertyName)) {
        return propertyName.text;
      }
      if (ts.isStringLiteral(propertyName)) {
        return propertyName.text;
      }
      return null;
    };

    /**
     * Validate that a key is a valid dot-notation identifier
     * Pattern: validIdentifier(.validIdentifier)*
     * Each segment must be a valid JavaScript identifier
     */
    const isValidKey = (key: string): boolean => {
      if (!key || key.trim() === '') {
        return false;
      }

      // Check if key is valid dot-notation identifier
      // Each segment must be a valid JavaScript identifier: [a-zA-Z_$][a-zA-Z0-9_$]*
      // Segments separated by dots
      return /^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(
        key,
      );
    };

    /**
     * Track invalid key for warning (avoid duplicates)
     */
    const trackInvalidKey = (key: string): void => {
      if (!invalidKeys.includes(key)) {
        invalidKeys.push(key);
      }
    };

    /**
     * Extract text from template expression
     */
    const extractTemplateText = (template: ts.TemplateExpression): string => {
      let templateText = '';
      for (const part of template.templateSpans) {
        if (part.literal) {
          templateText += part.literal.text;
        }
      }
      if (template.head) {
        templateText = template.head.text + templateText;
      }
      return templateText;
    };

    /**
     * Extract value from initializer node
     */
    const extractValueFromInitializer = (
      initializer: ts.Node,
    ): string | null => {
      const unwrapped = unwrapTypeAssertion(initializer);

      if (ts.isStringLiteral(unwrapped)) {
        return unwrapped.text;
      }

      if (ts.isTemplateExpression(unwrapped)) {
        return extractTemplateText(unwrapped);
      }

      if (ts.isNoSubstitutionTemplateLiteral(unwrapped)) {
        return unwrapped.text;
      }

      return null;
    };

    /**
     * Extract translation keys from an object literal expression
     * Validates keys during extraction for better performance
     */
    const extractFromObjectLiteral = (node: ts.Node, prefix = ''): void => {
      const objectNode = unwrapTypeAssertion(node);

      if (!ts.isObjectLiteralExpression(objectNode)) {
        return;
      }

      for (const property of objectNode.properties) {
        if (!ts.isPropertyAssignment(property) || !property.name) {
          continue;
        }

        const keyName = extractPropertyKeyName(property.name);
        if (!keyName) {
          continue;
        }

        const fullKey = prefix ? `${prefix}.${keyName}` : keyName;

        if (!isValidKey(fullKey)) {
          trackInvalidKey(fullKey);
          continue;
        }

        const initializer = property.initializer;
        if (!initializer) {
          continue;
        }

        const unwrappedInitializer = unwrapTypeAssertion(initializer);

        // Try to extract value from initializer
        const value = extractValueFromInitializer(unwrappedInitializer);
        if (value !== null) {
          keys[fullKey] = value;
          continue;
        }

        // Handle nested object literal
        if (ts.isObjectLiteralExpression(unwrappedInitializer)) {
          extractFromObjectLiteral(unwrappedInitializer, fullKey);
        }
      }
    };

    /**
     * Extract messages from object literal property
     */
    const extractMessagesFromProperty = (
      property: ts.ObjectLiteralElementLike,
      propertyName: string,
    ): void => {
      if (!ts.isPropertyAssignment(property)) {
        return;
      }

      // Check if property name matches (can be identifier or string literal)
      const propName = extractPropertyKeyName(property.name);
      if (propName !== propertyName) {
        return;
      }

      const messagesNode = unwrapTypeAssertion(property.initializer);
      if (ts.isObjectLiteralExpression(messagesNode)) {
        extractFromObjectLiteral(messagesNode);
      }
    };

    /**
     * Extract from createTranslationRef calls
     * Pattern: createTranslationRef({ id: 'plugin-id', messages: { key: 'value' } })
     * Returns the plugin ID from the 'id' field and extracts messages
     */
    const extractFromCreateTranslationRef = (
      node: ts.CallExpression,
    ): string | null => {
      const args = node.arguments;
      if (args.length === 0 || !ts.isObjectLiteralExpression(args[0])) {
        return null;
      }

      let extractedPluginId: string | null = null;

      for (const property of args[0].properties) {
        // Extract plugin ID from 'id' field
        if (
          ts.isPropertyAssignment(property) &&
          ts.isIdentifier(property.name) &&
          property.name.text === 'id' &&
          ts.isStringLiteral(property.initializer)
        ) {
          extractedPluginId = property.initializer.text;
        }
        // Extract messages
        if (property.name) {
          const propName = extractPropertyKeyName(property.name);
          if (propName === 'messages') {
            extractMessagesFromProperty(property, 'messages');
          }
        }
      }

      return extractedPluginId;
    };

    /**
     * Extract from createTranslationResource calls
     * Pattern: createTranslationResource({ ref: ..., translations: { ... } })
     */
    const extractFromCreateTranslationResource = (
      node: ts.CallExpression,
    ): void => {
      const args = node.arguments;
      if (args.length === 0 || !ts.isObjectLiteralExpression(args[0])) {
        return;
      }

      for (const property of args[0].properties) {
        if (
          ts.isPropertyAssignment(property) &&
          ts.isIdentifier(property.name) &&
          property.name.text === 'translations' &&
          ts.isObjectLiteralExpression(property.initializer)
        ) {
          extractFromObjectLiteral(property.initializer);
        }
      }
    };

    /**
     * Extract from createTranslationMessages calls
     * Pattern: createTranslationMessages({ ref: ..., messages: { key: 'value' } })
     */
    const extractFromCreateTranslationMessages = (
      node: ts.CallExpression,
    ): void => {
      const args = node.arguments;
      if (args.length === 0 || !ts.isObjectLiteralExpression(args[0])) {
        return;
      }

      for (const property of args[0].properties) {
        extractMessagesFromProperty(property, 'messages');
      }
    };

    /**
     * Extract from defineMessages calls
     * Pattern: defineMessages({ key: { id: 'key', defaultMessage: 'value' } })
     */
    const extractFromDefineMessages = (node: ts.CallExpression): void => {
      const args = node.arguments;
      if (args.length === 0 || !ts.isObjectLiteralExpression(args[0])) {
        return;
      }

      for (const property of args[0].properties) {
        if (
          ts.isPropertyAssignment(property) &&
          property.initializer &&
          ts.isObjectLiteralExpression(property.initializer)
        ) {
          // Extract the key name
          const keyName = extractPropertyKeyName(property.name);
          if (!keyName) {
            continue;
          }

          // Look for 'defaultMessage' or 'id' property in the message object
          for (const msgProperty of property.initializer.properties) {
            if (
              ts.isPropertyAssignment(msgProperty) &&
              msgProperty.name &&
              ts.isIdentifier(msgProperty.name)
            ) {
              const propName = msgProperty.name.text;
              if (
                (propName === 'defaultMessage' || propName === 'id') &&
                ts.isStringLiteral(msgProperty.initializer)
              ) {
                const value = msgProperty.initializer.text;
                if (isValidKey(keyName)) {
                  keys[keyName] = value;
                }
                break;
              }
            }
          }
        }
      }
    };

    /**
     * Check if variable name suggests it's a messages object
     */
    const isMessagesVariableName = (varName: string): boolean => {
      return (
        varName.includes('Messages') ||
        varName.includes('messages') ||
        varName.includes('translations')
      );
    };

    /**
     * Extract from exported const declarations
     * Pattern: export const messages = { ... }
     */
    const extractFromVariableStatement = (node: ts.VariableStatement): void => {
      const isExported = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword,
      );

      if (!isExported) {
        return;
      }

      for (const declaration of node.declarationList.declarations) {
        if (
          !declaration.initializer ||
          !ts.isObjectLiteralExpression(declaration.initializer)
        ) {
          continue;
        }

        const varName = ts.isIdentifier(declaration.name)
          ? declaration.name.text
          : '';

        if (isMessagesVariableName(varName)) {
          extractFromObjectLiteral(declaration.initializer);
        }
      }
    };

    /**
     * Extract key-value pair from translation function call
     */
    const extractFromTranslationCall = (
      args: ts.NodeArray<ts.Expression>,
    ): void => {
      if (args.length === 0 || !ts.isStringLiteral(args[0])) {
        return;
      }

      const key = args[0].text;

      // Validate key before storing (inline validation for better performance)
      if (!isValidKey(key)) {
        if (!invalidKeys.includes(key)) {
          invalidKeys.push(key);
        }
        return;
      }

      const value =
        args.length > 1 && ts.isStringLiteral(args[1]) ? args[1].text : key;
      keys[key] = value;
    };

    /**
     * Extract from t() function calls
     */
    const extractFromTFunction = (node: ts.CallExpression): void => {
      extractFromTranslationCall(node.arguments);
    };

    /**
     * Check if node is i18n.t() call
     */
    const isI18nTCall = (node: ts.CallExpression): boolean => {
      return (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'i18n' &&
        ts.isIdentifier(node.expression.name) &&
        node.expression.name.text === 't'
      );
    };

    /**
     * Extract from i18n.t() method calls
     */
    const extractFromI18nT = (node: ts.CallExpression): void => {
      if (!isI18nTCall(node)) {
        return;
      }
      extractFromTranslationCall(node.arguments);
    };

    /**
     * Check if node is useTranslation().t() call
     */
    const isUseTranslationTCall = (node: ts.CallExpression): boolean => {
      if (!ts.isPropertyAccessExpression(node.expression)) {
        return false;
      }

      const propertyAccess = node.expression;
      if (!ts.isCallExpression(propertyAccess.expression)) {
        return false;
      }

      const innerCall = propertyAccess.expression;
      return (
        ts.isIdentifier(innerCall.expression) &&
        innerCall.expression.text === 'useTranslation' &&
        ts.isIdentifier(propertyAccess.name) &&
        propertyAccess.name.text === 't'
      );
    };

    /**
     * Extract from useTranslation().t() calls
     */
    const extractFromUseTranslationT = (node: ts.CallExpression): void => {
      if (!isUseTranslationTCall(node)) {
        return;
      }
      extractFromTranslationCall(node.arguments);
    };

    /**
     * Extract from JSX Trans component
     */
    const extractFromJsxTrans = (
      node: ts.JsxElement | ts.JsxSelfClosingElement,
    ): void => {
      const tagName = ts.isJsxElement(node)
        ? node.openingElement.tagName
        : node.tagName;

      if (!ts.isIdentifier(tagName) || tagName.text !== 'Trans') {
        return;
      }

      const attributes = ts.isJsxElement(node)
        ? node.openingElement.attributes
        : node.attributes;

      if (!ts.isJsxAttributes(attributes)) {
        return;
      }

      attributes.properties.forEach((attr: any) => {
        if (
          ts.isJsxAttribute(attr) &&
          ts.isIdentifier(attr.name) &&
          attr.name.text === 'i18nKey' &&
          attr.initializer &&
          ts.isStringLiteral(attr.initializer)
        ) {
          const key = attr.initializer.text;
          keys[key] = key;
        }
      });
    };

    /**
     * Check if node is a call expression with specific function name
     */
    const isCallExpressionWithName = (
      node: ts.Node,
      functionName: string,
    ): node is ts.CallExpression => {
      return (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === functionName
      );
    };

    /**
     * Extract keys from TranslationRef type literal
     */
    const extractFromTranslationRefType = (
      messagesType: ts.TypeLiteralNode,
    ): void => {
      for (const member of messagesType.members) {
        if (!ts.isPropertySignature(member) || !member.name) {
          continue;
        }

        const keyName = extractPropertyKeyName(member.name);
        if (!keyName || !member.type) {
          continue;
        }

        if (!ts.isLiteralTypeNode(member.type)) {
          continue;
        }

        const literalType = member.type;
        if (!literalType.literal || !ts.isStringLiteral(literalType.literal)) {
          continue;
        }

        const stringValue = literalType.literal.text;
        if (isValidKey(keyName)) {
          keys[keyName] = stringValue;
        } else {
          trackInvalidKey(keyName);
        }
      }
    };

    /**
     * Extract from TranslationRef type declarations in variable statements
     */
    const extractFromTranslationRefDeclarations = (
      node: ts.VariableStatement,
    ): void => {
      for (const decl of node.declarationList.declarations) {
        if (!decl.type || !ts.isTypeReferenceNode(decl.type)) {
          continue;
        }

        const typeRef = decl.type;
        if (
          !ts.isIdentifier(typeRef.typeName) ||
          typeRef.typeName.text !== 'TranslationRef' ||
          !typeRef.typeArguments ||
          typeRef.typeArguments.length < 2
        ) {
          continue;
        }

        // Second type argument is the messages object type
        const messagesType = typeRef.typeArguments[1];
        if (ts.isTypeLiteralNode(messagesType)) {
          extractFromTranslationRefType(messagesType);
        }
      }
    };

    /**
     * Handle call expression nodes
     */
    const handleCallExpression = (node: ts.CallExpression): void => {
      if (isCallExpressionWithName(node, 'createTranslationRef')) {
        const extractedPluginId = extractFromCreateTranslationRef(node);
        if (extractedPluginId && !pluginId) {
          pluginId = extractedPluginId;
        }
      } else if (isCallExpressionWithName(node, 'createTranslationResource')) {
        extractFromCreateTranslationResource(node);
      } else if (isCallExpressionWithName(node, 'createTranslationMessages')) {
        extractFromCreateTranslationMessages(node);
      } else if (isCallExpressionWithName(node, 'defineMessages')) {
        extractFromDefineMessages(node);
      } else if (isCallExpressionWithName(node, 't')) {
        extractFromTFunction(node);
      } else if (isI18nTCall(node)) {
        extractFromI18nT(node);
      } else if (isUseTranslationTCall(node)) {
        extractFromUseTranslationT(node);
      }
    };

    /**
     * Handle variable statement nodes
     */
    const handleVariableStatement = (node: ts.VariableStatement): void => {
      extractFromVariableStatement(node);
      extractFromTranslationRefDeclarations(node);
    };

    /**
     * Handle JSX nodes
     */
    const handleJsxNode = (
      node: ts.JsxElement | ts.JsxSelfClosingElement,
    ): void => {
      extractFromJsxTrans(node);
    };

    // Visit all nodes in the AST
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        handleCallExpression(node);
      } else if (ts.isVariableStatement(node)) {
        handleVariableStatement(node);
      } else if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        handleJsxNode(node);
      }

      // Recursively visit child nodes
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Log warnings for invalid keys if any were found
    if (invalidKeys.length > 0) {
      // Use console.warn instead of chalk to avoid dependency
      // The calling code can format these warnings if needed
      console.warn(
        `⚠️  Skipped ${
          invalidKeys.length
        } invalid key(s) in ${filePath}: ${invalidKeys.slice(0, 5).join(', ')}${
          invalidKeys.length > 5 ? '...' : ''
        }`,
      );
    }
  } catch (error) {
    // If TypeScript parsing fails, fall back to regex-based extraction
    console.warn(
      `⚠️  Warning: AST parsing failed for ${filePath}, falling back to regex: ${error}`,
    );
    return { keys: extractKeysWithRegex(content), pluginId: null };
  }

  return { keys, pluginId };
}

/**
 * Validate that a key is a valid dot-notation identifier (for regex fallback)
 */
function isValidKeyRegex(key: string): boolean {
  if (!key || key.trim() === '') {
    return false;
  }
  // Check if key is valid dot-notation identifier
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(key);
}

/**
 * Fallback regex-based key extraction for non-TypeScript files
 */
function extractKeysWithRegex(content: string): Record<string, string> {
  const keys: Record<string, string> = {};

  // Common patterns for translation keys
  // Note: createTranslationMessages pattern is handled by AST parser above
  // This regex fallback is for non-TypeScript files or when AST parsing fails
  // Split patterns to avoid nested optional groups that cause ReDoS vulnerabilities
  const patterns = [
    // TranslationRef type declarations: readonly "key": "value"
    // Pattern from .d.ts files: readonly "starredEntities.noStarredEntitiesMessage": "Click the star..."
    /readonly\s+["']([^"']+)["']\s*:\s*["']([^"']*?)["']/g,
    // t('key', 'value') - with second parameter
    /t\s*\(\s*['"`]([^'"`]+?)['"`]\s*,\s*['"`]([^'"`]*?)['"`]\s*\)/g,
    // t('key') - without second parameter
    /t\s*\(\s*['"`]([^'"`]+?)['"`]\s*\)/g,
    // i18n.t('key', 'value') - with second parameter
    /i18n\s*\.\s*t\s*\(\s*['"`]([^'"`]+?)['"`]\s*,\s*['"`]([^'"`]*?)['"`]\s*\)/g,
    // i18n.t('key') - without second parameter
    /i18n\s*\.\s*t\s*\(\s*['"`]([^'"`]+?)['"`]\s*\)/g,
    // useTranslation().t('key', 'value') - with second parameter
    /useTranslation\s*\(\s*\)\s*\.\s*t\s*\(\s*['"`]([^'"`]+?)['"`]\s*,\s*['"`]([^'"`]*?)['"`]\s*\)/g,
    // useTranslation().t('key') - without second parameter
    /useTranslation\s*\(\s*\)\s*\.\s*t\s*\(\s*['"`]([^'"`]+?)['"`]\s*\)/g,
    // Trans i18nKey="key"
    /i18nKey\s*=\s*['"`]([^'"`]+?)['"`]/g,
  ];

  for (const pattern of patterns) {
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(content)) !== null) {
      // For readonly pattern, match[1] is key and match[2] is value
      // For other patterns, match[1] is key and match[2] is optional value
      const key = match[1];

      // Validate key before storing (inline validation for better performance)
      if (!isValidKeyRegex(key)) {
        continue; // Skip invalid keys
      }

      const value = match[2] || key;
      // Only add if we have a meaningful value (not just the key repeated)
      if (value && value !== key) {
        keys[key] = value;
      } else if (!keys[key]) {
        // If no value provided, use key as placeholder
        keys[key] = key;
      }
    }
  }

  return keys;
}

/*
 * Copyright The Backstage Authors
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

import type { ReactElement, ReactNode } from 'react';
import { cloneElement } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { marketplaceTranslationRef } from '../translations';

type Messages = typeof marketplaceTranslationRef.T;

interface TransProps<TMessages extends { [key: string]: string }> {
  message: keyof TMessages;
  params?: any;
  components?: Record<string, ReactElement>;
}

export const Trans = ({
  message,
  params,
  components,
}: TransProps<Messages>) => {
  const { t } = useTranslation();
  const translatedText = t(message as any, params);

  if (!components) {
    return translatedText;
  }

  // Parse the translated text and replace component placeholders
  const parts: ReactNode[] = [];
  let currentIndex = 0;

  // Find all component tags in the translated text
  const regex = /<(\w+)>(.*?)<\/\1>/g;
  let match = regex.exec(translatedText);

  while (match !== null) {
    const [fullMatch, componentKey, content] = match;
    const startIndex = match.index;

    // Add text before the component
    if (startIndex > currentIndex) {
      parts.push(translatedText.slice(currentIndex, startIndex));
    }

    // Add the component if it exists in the components prop
    if (components[componentKey]) {
      parts.push(
        cloneElement(
          components[componentKey],
          { key: `${componentKey}-${startIndex}` },
          content,
        ),
      );
    } else {
      // If component not found, keep the original text
      parts.push(fullMatch);
    }

    currentIndex = startIndex + fullMatch.length;
    match = regex.exec(translatedText);
  }

  // Add remaining text after the last component
  if (currentIndex < translatedText.length) {
    parts.push(translatedText.slice(currentIndex));
  }

  return <>{parts}</>;
};

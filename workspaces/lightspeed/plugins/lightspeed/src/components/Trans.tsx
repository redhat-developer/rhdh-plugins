/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the file except in compliance with the License.
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

import { cloneElement } from 'react';

import { useTranslation } from '../hooks/useTranslation';

interface TransProps {
  message: string;
  params?: Record<string, any>;
  components?: Record<string, React.ReactElement>;
}

export const Trans = ({ message, params, components }: TransProps) => {
  const { t } = useTranslation();
  const translatedText = t(message as any, params || {});

  // If no components are provided, just return the text
  if (!components) {
    return <>{translatedText}</>;
  }

  // Simple string replacement approach - no regex, no security risks
  let result = translatedText;

  // Replace each placeholder with a unique marker
  const markers: Record<string, React.ReactElement> = {};
  let markerIndex = 0;

  for (const [placeholder, component] of Object.entries(components)) {
    const marker = `__MARKER_${markerIndex}__`;
    markers[marker] = component;
    result = result.replace(new RegExp(escapeRegExp(placeholder), 'g'), marker);
    markerIndex++;
  }

  // Split by markers and render components
  const parts = result.split(/(__MARKER_\d+__)/);

  return (
    <>
      {parts.map((part: string, index: number) => {
        if (markers[part]) {
          return cloneElement(markers[part], { key: index });
        }
        return part;
      })}
    </>
  );
};

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

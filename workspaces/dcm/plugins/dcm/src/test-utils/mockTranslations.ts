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

import React from 'react';
import { dcmMessages } from '../translations/ref';

/** Flatten the nested dcmMessages object into { 'a.b.c': 'English text' }. */
function flattenMessages(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null) {
      Object.assign(
        acc,
        flattenMessages(val as Record<string, unknown>, fullKey),
      );
    } else {
      acc[fullKey] = String(val);
    }
    return acc;
  }, {} as Record<string, string>);
}

const flatMessages = flattenMessages(dcmMessages);

/**
 * Mock translation function that returns the English default value.
 * Supports `{{param}}` interpolation via a `params` object.
 */
export const mockT = (
  key: string,
  params?: Record<string, string | number>,
) => {
  let msg = flatMessages[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      msg = msg.replace(
        new RegExp(String.raw`\{\{${param}\}\}`, 'g'),
        String(value),
      );
    });
  }
  return msg;
};

export const mockUseTranslation = () => ({ t: mockT });

export const MockTrans = ({
  message,
  values,
}: {
  message: string;
  values?: Record<string, React.ReactNode>;
}): React.ReactNode => {
  const template = mockT(message);
  if (!values) return template;
  return template.split(/(\{\{\w+\}\})/).map((part: string) => {
    const match = part.match(/^\{\{(\w+)\}\}$/);
    return match ? values[match[1]] ?? part : part || null;
  });
};

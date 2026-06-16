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
import { useTranslation } from '../hooks/useTranslation';

type TransValues = Record<string, React.ReactNode>;

/**
 * Renders a translated message with optional React node interpolation.
 *
 * Each `{{param}}` placeholder in the translated string is replaced by the
 * corresponding value from `values`. Values may be plain strings, numbers,
 * or any React node (e.g. <strong>, <em>).
 *
 * @example
 * <Trans
 *   message="deleteDialog.body"
 *   values={{ resourceName: <strong>{name}</strong> }}
 * />
 */
export function Trans({
  message,
  values,
}: {
  message: string;
  values?: TransValues;
}) {
  const { t } = useTranslation();
  const template = (t as any)(message) as string;

  if (!values) return <>{template}</>;

  const parts: React.ReactNode[] = template
    .split(/(\{\{\w+\}\})/)
    .map((part: string, i: number) => {
      const match = part.match(/^\{\{(\w+)\}\}$/);
      const node = match ? values[match[1]] ?? part : part || null;
      // eslint-disable-next-line react/no-array-index-key
      return <React.Fragment key={i}>{node}</React.Fragment>;
    });

  return <>{parts}</>;
}

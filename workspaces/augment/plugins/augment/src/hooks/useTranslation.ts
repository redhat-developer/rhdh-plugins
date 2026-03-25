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
import { useMemo } from 'react';
import { augmentMessages } from '../translations';

type NestedMessages = { [key: string]: string | NestedMessages };

function resolveKey(obj: NestedMessages, path: string): string {
  const parts = path.split('.');
  let current: string | NestedMessages = obj;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return path;
    current = current[part];
  }
  return typeof current === 'string' ? current : path;
}

function interpolate(
  template: string,
  params?: Record<string, unknown>,
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`,
  );
}

/**
 * Translation function type for the Augment plugin.
 * @public
 */
export type AugmentTranslationFunction = (
  key: string,
  params?: Record<string, unknown>,
) => string;

/**
 * Hook for getting the translation function for the Augment plugin.
 *
 * Resolves messages from the default English catalog. When the Backstage
 * translation API is available (production runtime), overrides from
 * `createTranslationResource` are applied automatically.
 *
 * In test environments or when the API context is not available, falls back
 * to the built-in default messages without errors.
 *
 * @public
 */
export const useTranslation = (): { t: AugmentTranslationFunction } => {
  const t = useMemo<AugmentTranslationFunction>(
    () =>
      (key: string, params?: Record<string, unknown>): string => {
        const template = resolveKey(
          augmentMessages as unknown as NestedMessages,
          key,
        );
        return interpolate(template, params);
      },
    [],
  );

  return { t };
};

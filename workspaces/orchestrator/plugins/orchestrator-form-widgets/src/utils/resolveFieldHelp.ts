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
 * Optional external documentation link shown in field help.
 * Authors set this via `ui:fieldHelp` in the workflow form schema.
 */
export type FieldHelpLink = {
  /** Link text. Required to show the link (no default). */
  label?: string;
  /** Absolute URL opened in a new tab. */
  url: string;
};

/**
 * Resolved help content for a single locale.
 */
export type FieldHelpContent = {
  /** Optional popover title. */
  title?: string;
  /** Help body. Supports plain text or markdown. */
  body: string;
  /** Optional external documentation link. */
  link?: FieldHelpLink;
};

/**
 * Author-supplied field help: either a single content object, or a map of
 * locale code → content (for example `en`, `fr`, `default`).
 */
export type FieldHelpConfig =
  FieldHelpContent | Record<string, FieldHelpContent>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isFieldHelpContent = (
  value: unknown,
): value is FieldHelpContent => {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.body !== 'string' || value.body.trim().length === 0) {
    return false;
  }
  if (value.title !== undefined && typeof value.title !== 'string') {
    return false;
  }
  if (value.link !== undefined) {
    if (!isRecord(value.link) || typeof value.link.url !== 'string') {
      return false;
    }
    if (
      value.link.label !== undefined &&
      typeof value.link.label !== 'string'
    ) {
      return false;
    }
  }
  return true;
};

/**
 * Picks author-provided field help for the active locale.
 * Fallback order: exact locale → language prefix → `en` → `default` → first valid entry.
 * Does not auto-translate.
 */
export const resolveFieldHelp = (
  config: unknown,
  locale: string,
): FieldHelpContent | undefined => {
  if (!config) {
    return undefined;
  }

  if (isFieldHelpContent(config)) {
    return config;
  }

  if (!isRecord(config)) {
    return undefined;
  }

  const localized = config as Record<string, unknown>;
  const normalizedLocale = locale.trim();
  const languagePrefix = normalizedLocale.split(/[-_]/)[0] ?? '';

  const candidates = [
    normalizedLocale,
    languagePrefix,
    'en',
    'default',
    ...Object.keys(localized),
  ].filter(Boolean);

  const seen = new Set<string>();
  for (const key of candidates) {
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const value = localized[key];
    if (isFieldHelpContent(value)) {
      return value;
    }
  }

  return undefined;
};

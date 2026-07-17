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
 * Minimal translation function signature shared by all form validation helpers.
 * Compatible with the `t` function returned by `useTranslation`.
 */
export type TFunction = (key: string, ...args: any[]) => string;

/**
 * Returns a message helper `m(key, fallback, opts?)` that:
 * - calls `t(key, opts)` when a translation function is available, or
 * - returns `fallback` with `{{param}}` placeholders replaced by `opts` values
 *   when no translation function is provided (tests / server-side paths).
 */
export function makeTranslator(t?: TFunction) {
  return function m(
    key: string,
    fallback: string,
    opts?: Record<string, string | number>,
  ): string {
    if (t) return t(key, opts);
    if (!opts) return fallback;
    return fallback.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts[k] ?? k));
  };
}

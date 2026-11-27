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

import {
  TranslationFunction,
  useTranslationRef,
} from '@backstage/core-plugin-api/alpha';

import { bulkImportTranslationRef, type Messages } from '../translations';

/**
 * @alpha
 */
type BulkImportT = TranslationFunction<typeof bulkImportTranslationRef.T>;
type TranslationKey = keyof Messages;

/** Interpolated messages; Backstage typings do not infer `{{placeholders}}` from ref strings. */
const translateWithParams = (
  t: BulkImportT,
  key: TranslationKey,
  params: Record<string, string | number>,
): string =>
  (t as unknown as (k: string, p: Record<string, string | number>) => string)(
    String(key),
    params,
  );

export const useTranslation = (): {
  t: BulkImportT;
  tParams: (
    key: TranslationKey,
    params: Record<string, string | number>,
  ) => string;
} => {
  const { t } = useTranslationRef(bulkImportTranslationRef);
  return {
    t,
    tParams: (key, params) => translateWithParams(t, key, params),
  };
};

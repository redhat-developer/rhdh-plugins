/*
 * Copyright The Backstage Authors and Red Hat, Inc.
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
  TranslationRef,
  TranslationResource,
} from '@backstage/core-plugin-api/alpha';

/** @internal */
type AnyMessages = { [key in string]: string };

/** @internal */
export interface InternalTranslationRef<
  TId extends string = string,
  TMessages extends { [key in string]: string } = { [key in string]: string },
> extends TranslationRef<TId, TMessages> {
  version: 'v1';

  getDefaultMessages(): AnyMessages;

  getDefaultResource(): TranslationResource | undefined;
}

/** @internal */
export function toInternalTranslationRef<
  TId extends string,
  TMessages extends AnyMessages,
>(ref: TranslationRef<TId, TMessages>): InternalTranslationRef<TId, TMessages> {
  const r = ref as InternalTranslationRef<TId, TMessages>;
  if (r.$$type !== '@backstage/TranslationRef') {
    throw new Error(`Invalid translation ref, bad type '${r.$$type}'`);
  }
  if (r.version !== 'v1') {
    throw new Error(`Invalid translation ref, bad version '${r.version}'`);
  }
  return r;
}

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
import { TranslationResource } from '@backstage/core-plugin-api/alpha';

/** @internal */
export type InternalTranslationResourceLoader = () => Promise<{
  messages: { [key in string]: string | null };
}>;

/** @internal */
export interface InternalTranslationResource<TId extends string = string>
  extends TranslationResource<TId> {
  version: 'v1';
  resources: Array<{
    language: string;
    loader: InternalTranslationResourceLoader;
  }>;
}

/** @internal */
export function toInternalTranslationResource<TId extends string>(
  resource: TranslationResource<TId>,
): InternalTranslationResource<TId> {
  const r = resource as InternalTranslationResource<TId>;
  if (r.$$type !== '@backstage/TranslationResource') {
    throw new Error(`Invalid translation resource, bad type '${r.$$type}'`);
  }
  if (r.version !== 'v1') {
    throw new Error(`Invalid translation resource, bad version '${r.version}'`);
  }

  return r;
}

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
import { JsonValue } from '@backstage/types/index';
import { TypographyVariant } from '@mui/material/styles';

export type UiProps = {
  'ui:variant'?: TypographyVariant;
  'ui:text'?: string;
  'ui:allowNewItems'?: boolean;
  'fetch:url'?: string;
  'fetch:method'?: 'GET' | 'POST';
  'fetch:headers'?: Record<string, string>;
  'fetch:body'?: Record<string, JsonValue>;
  'fetch:retrigger'?: string[];
  'fetch:error:ignoreUnready'?: boolean;
  [key: `fetch:response:${string}`]: JsonValue;
};

export const isFetchResponseKey = (
  key: string,
): key is `fetch:response:${string}` => {
  return key.startsWith('fetch:response:');
};

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
  useTranslationRef,
  TranslationFunction,
} from '@backstage/core-plugin-api/alpha';

import { x2aPluginTranslationRef } from '../translations';

/**
 * Hook for getting the translation function for the x2a plugin.
 *
 * @public
 */
export const useTranslation = (): {
  t: TranslationFunction<typeof x2aPluginTranslationRef.T>;
} => useTranslationRef(x2aPluginTranslationRef);

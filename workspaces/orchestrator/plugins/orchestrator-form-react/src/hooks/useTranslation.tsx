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

import { useStepperContext } from '../utils/StepperContext';

export type TranslationFunction = (key: string) => string;

// Motivation for passing t in the context:
// Keep a single set of translation files
// Avoid introduction new plugin for them
// Avoid moving them to a common package

export const useTranslation = (): {
  t: TranslationFunction;
} => ({ t: useStepperContext().t });

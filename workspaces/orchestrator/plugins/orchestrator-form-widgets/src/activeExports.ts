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
 * Public Active-widget authoring API.
 *
 * Import from
 * `@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets/active`.
 *
 * @packageDocumentation
 */

export { FormWidgetsApi } from './FormWidgetsApi';
export type {
  ActiveWidget,
  FormWidgetsApiOptions,
} from './FormWidgetsApiOptions';
export { defaultActiveWidgets } from './defaultActiveWidgets';

export { isFetchResponseKey, type UiProps } from './uiPropTypes';

export { useFetch } from './utils/useFetch';
export { useFetchAndEvaluate } from './utils/useFetchAndEvaluate';
export { useRetriggerEvaluate } from './utils/useRetriggerEvaluate';
export { useTemplateUnitEvaluator } from './utils/useTemplateUnitEvaluator';
export { useProcessingState } from './utils/useProcessingState';
export {
  useClearOnRetrigger,
  type UseClearOnRetriggerArgs,
} from './utils/useClearOnRetrigger';
export { useResolvedFieldHelp } from './utils/useResolvedFieldHelp';
export {
  applySelectorString,
  applySelectorArray,
  applySelectorObject,
} from './utils/applySelector';
export {
  evaluateFetchResponseSelectorTemplate,
  type EvaluateTemplateProps,
  type EvaluateTemplateStringProps,
} from './utils/evaluateTemplate';

export { fetchWithRetry, type FetchRetryOptions } from './utils/retry';

export { ErrorText, type ErrorTextProps } from './widgets/ErrorText';
export {
  FieldHelp,
  FieldLabelWithHelp,
  FieldWithHelpLayout,
  type FieldHelpProps,
} from './components/FieldHelp';
export type { FieldHelpContent, FieldHelpLink } from './utils/resolveFieldHelp';

export { ExampleActiveWidget } from './examples/ExampleActiveWidget';

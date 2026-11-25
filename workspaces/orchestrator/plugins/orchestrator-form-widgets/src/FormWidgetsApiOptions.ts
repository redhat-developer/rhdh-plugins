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

import { JsonObject } from '@backstage/types';
import { Widget } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';
import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

/**
 * RJSF widget typed for Orchestrator form context.
 *
 * @public
 */
export type ActiveWidget = Widget<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
>;

/**
 * Options for {@link FormWidgetsApi}.
 *
 * When the same widget name exists in both `defaultActiveWidgets` and
 * `additionalWidgets`, the additional entry wins.
 *
 * @public
 */
export type FormWidgetsApiOptions = {
  /**
   * Extra widgets merged into the built-in registry.
   * Keys are `ui:widget` names.
   */
  additionalWidgets?: Record<string, ActiveWidget>;
};

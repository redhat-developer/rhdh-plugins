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

import { FieldTemplateProps } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';

import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

/**
 * Higher-order function that wraps a FieldTemplate to support ui:hidden.
 * When ui:hidden is true, the field is rendered but hidden from view using CSS.
 * The field still participates in form submission and validation.
 */
export const createHiddenFieldTemplate = (
  DefaultFieldTemplate: React.ComponentType<
    FieldTemplateProps<JsonObject, JSONSchema7, OrchestratorFormContextProps>
  >,
) => {
  return (
    props: FieldTemplateProps<
      JsonObject,
      JSONSchema7,
      OrchestratorFormContextProps
    >,
  ) => {
    const { uiSchema } = props;
    const isHidden = uiSchema?.['ui:hidden'];

    if (isHidden) {
      return (
        <div style={{ display: 'none' }} data-hidden-field="true">
          <DefaultFieldTemplate {...props} />
        </div>
      );
    }

    // Use default template for non-hidden fields
    return <DefaultFieldTemplate {...props} />;
  };
};

export default createHiddenFieldTemplate;

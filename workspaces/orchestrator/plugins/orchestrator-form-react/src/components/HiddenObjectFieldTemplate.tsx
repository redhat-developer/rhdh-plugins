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

import Grid from '@mui/material/Grid';
import {
  canExpand,
  descriptionId,
  getTemplate,
  getUiOptions,
  ObjectFieldTemplateProps,
  titleId,
  UiSchema,
} from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';

import { HiddenCondition } from '../types/HiddenCondition';
import { evaluateHiddenCondition } from '../utils/evaluateHiddenCondition';

const getHiddenCondition = (
  uiSchema: UiSchema<JsonObject, JSONSchema7> | undefined,
  name: string,
): HiddenCondition | undefined => {
  if (!uiSchema || !(name in uiSchema)) {
    return undefined;
  }
  return (uiSchema as Record<string, any>)[name]?.['ui:hidden'] as
    | HiddenCondition
    | undefined;
};

const HiddenObjectFieldTemplate = (
  props: ObjectFieldTemplateProps<JsonObject, JSONSchema7>,
) => {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    idSchema,
    schema,
    formData,
    onAddClick,
    registry,
    formContext,
  } = props;

  const uiOptions = getUiOptions<JsonObject, JSONSchema7>(uiSchema);
  const TitleFieldTemplate = getTemplate(
    'TitleFieldTemplate',
    registry,
    uiOptions,
  );
  const DescriptionFieldTemplate = getTemplate(
    'DescriptionFieldTemplate',
    registry,
    uiOptions,
  );
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const rootFormData =
    (formContext?.formData as JsonObject) || (formData as JsonObject) || {};

  return (
    <>
      {title && (
        <TitleFieldTemplate
          id={titleId(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId(idSchema)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Grid container spacing={2} style={{ marginTop: '10px' }}>
        {properties.map(element => {
          const hiddenCondition = getHiddenCondition(uiSchema, element.name);
          const isHiddenByCondition =
            hiddenCondition !== undefined
              ? evaluateHiddenCondition(hiddenCondition, rootFormData)
              : false;
          const isHidden = element.hidden || isHiddenByCondition;

          return isHidden ? (
            <div
              key={element.name}
              style={{ display: 'none' }}
              data-hidden-field="true"
            >
              {element.content}
            </div>
          ) : (
            <Grid
              item
              xs={12}
              key={element.name}
              style={{ marginBottom: '10px' }}
            >
              {element.content}
            </Grid>
          );
        })}
        {canExpand(schema, uiSchema, formData) && (
          <Grid container justifyContent="flex-end">
            <Grid item>
              <AddButton
                className="object-property-expand"
                onClick={onAddClick(schema)}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default HiddenObjectFieldTemplate;

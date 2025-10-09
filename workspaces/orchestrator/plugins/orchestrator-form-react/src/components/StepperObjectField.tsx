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
import { useMemo } from 'react';

import { JsonObject } from '@backstage/types';

import ObjectField from '@rjsf/core/lib/components/fields/ObjectField';
import { ErrorSchema, FieldProps, IdSchema } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';

import { useTranslation } from '../hooks/useTranslation';
import { getSortedStepEntries } from '../utils/getSortedStepEntries';
import OrchestratorFormStepper, {
  OrchestratorFormStep,
  OrchestratorFormToolbar,
} from './OrchestratorFormStepper';

const StepperObjectField = ({
  formData,
  schema,
  uiSchema,
  onChange,
  registry,
  idSchema,
  errorSchema,
  ...props
}: FieldProps<JsonObject, JSONSchema7>) => {
  const { t } = useTranslation();

  const sortedStepEntries = useMemo(
    () => getSortedStepEntries(schema),
    [schema],
  );
  if (sortedStepEntries === undefined) {
    throw new Error(t('stepperObjectField.error'));
  }

  const steps = sortedStepEntries.reduce<OrchestratorFormStep[]>(
    (prev, [key, subSchema]) => {
      if (typeof subSchema === 'boolean') {
        return prev;
      }

      return [
        ...prev,
        {
          content: (
            <>
              <ObjectField<JsonObject, JSONSchema7>
                {...props}
                schema={{ ...subSchema, title: '' }} // the title is in the step
                uiSchema={uiSchema?.[key] || {}}
                formData={(formData?.[key] as JsonObject) || {}}
                onChange={data => {
                  onChange({ ...formData, [key]: data });
                }}
                idSchema={idSchema[key] as IdSchema<JsonObject>}
                registry={{
                  ...registry,
                  fields: {
                    ...registry.fields,
                    ObjectField: ObjectField, // undo override of objectfield
                  },
                }}
                errorSchema={errorSchema?.[key] as ErrorSchema<JsonObject>}
              />
              <OrchestratorFormToolbar />
            </>
          ),
          title: subSchema.title || key,
          key,
        },
      ];
    },
    [],
  );
  return <OrchestratorFormStepper steps={steps} />;
};

export default StepperObjectField;

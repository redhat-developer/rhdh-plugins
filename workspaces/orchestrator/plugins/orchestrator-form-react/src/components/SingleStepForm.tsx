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

import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

import OrchestratorFormStepper, {
  OrchestratorFormStep,
  OrchestratorFormToolbar,
} from './OrchestratorFormStepper';
import OrchestratorFormWrapper from './OrchestratorFormWrapper';

type SingleStepFormProps = Pick<
  OrchestratorFormContextProps,
  | 'schema'
  | 'updateSchema'
  | 'onSubmit'
  | 'uiSchema'
  | 'formData'
  | 'setFormData'
  | 'setAuthTokenDescriptors'
  | 'getIsChangedByUser'
  | 'setIsChangedByUser'
>;

const SingleStepForm = (props: SingleStepFormProps) => {
  const steps = useMemo<OrchestratorFormStep[]>(() => {
    return [
      {
        title: props.schema.title ?? 'Inputs',
        key: 'schema',
        content: (
          <OrchestratorFormWrapper
            {...props}
            schema={{ ...props.schema, title: '' }}
          >
            <OrchestratorFormToolbar />
          </OrchestratorFormWrapper>
        ),
      },
    ];
  }, [props]);
  return <OrchestratorFormStepper steps={steps} />;
};

export default SingleStepForm;

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

import { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';
import { AdversarialAgentsSelector } from '../../components/CreateProjectPage/AdversarialAgentsSelector';

/** @public */
export const AdversarialAgentsPickerFieldExtension = (
  props: FieldExtensionComponentProps<string[]>,
) => {
  const { onChange, rawErrors, formData } = props;

  return (
    <>
      <AdversarialAgentsSelector
        selectedAgentIds={formData || []}
        onSelectionChange={onChange}
      />
      {rawErrors && rawErrors.length > 0 && (
        <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '8px' }}>
          {rawErrors.join(', ')}
        </div>
      )}
    </>
  );
};

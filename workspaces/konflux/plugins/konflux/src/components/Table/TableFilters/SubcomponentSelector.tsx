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

import { useEntity } from '@backstage/plugin-catalog-react';
import {
  FormGroup,
  FormSelect,
  FormSelectOption,
  ToolbarItem,
} from '@patternfly/react-core';
import { useEntitySubcomponents } from '../../../hooks/useEntitySubcomponents';
import { getEntityDisplayName } from '../../../utils/entities';

type Props = {
  subcomponents?: string[];
  selectedSubcomponent?: string;
  onSelectedSubcomponent?: (val: string) => void;
  isFetching: boolean;
};

export const SubcomponentSelector = ({
  subcomponents,
  selectedSubcomponent,
  onSelectedSubcomponent,
  isFetching,
}: Props) => {
  const { entity } = useEntity();
  const { loading, subcomponentEntities } = useEntitySubcomponents(entity);

  if (!subcomponents?.length || !onSelectedSubcomponent || loading) return null;

  return (
    <ToolbarItem>
      <FormGroup label="Subcomponent">
        <FormSelect
          id="subcomponent-selector"
          data-testid="subcomponent-selector"
          value={selectedSubcomponent}
          onChange={(_e, value) => onSelectedSubcomponent(value as string)}
          label="Subcomponent"
          isDisabled={isFetching}
        >
          <FormSelectOption value="All" key="All" label="All" />
          {subcomponents.map(sub => {
            const entityDisplayName = getEntityDisplayName(
              sub,
              subcomponentEntities,
            );
            return (
              <FormSelectOption
                key={sub}
                value={sub}
                label={entityDisplayName}
              />
            );
          })}
        </FormSelect>
      </FormGroup>
    </ToolbarItem>
  );
};

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
  FormGroup,
  FormSelect,
  FormSelectOption,
  ToolbarItem,
} from '@patternfly/react-core';

type Props = {
  pipelineRunTypes?: string[];
  selectedPipelineRunType?: string;
  onSelectedPipelineRunType?: (val: string) => void;
  isFetching: boolean;
};

export const PipelineRunTypeSelector = ({
  pipelineRunTypes,
  selectedPipelineRunType,
  onSelectedPipelineRunType,
  isFetching,
}: Props) => {
  if (!pipelineRunTypes?.length || !onSelectedPipelineRunType) return null;

  return (
    <ToolbarItem>
      <FormGroup label="Type">
        <FormSelect
          id="type-selector"
          data-testid="type-selector"
          value={selectedPipelineRunType}
          onChange={(_e, value) => onSelectedPipelineRunType(value as string)}
          label="Type"
          isDisabled={isFetching}
        >
          <FormSelectOption value="All" key="All" label="All" />
          {pipelineRunTypes.map(plrType => (
            <FormSelectOption key={plrType} value={plrType} label={plrType} />
          ))}
        </FormSelect>
      </FormGroup>
    </ToolbarItem>
  );
};

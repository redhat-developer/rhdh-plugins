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
  pipelineRunStatuses?: string[];
  selectedPipelineRunStatus?: string;
  onSelectedPipelineRunStatus?: (val: string) => void;
  isFetching: boolean;
};

export const PipelineRunStatusSelector = ({
  pipelineRunStatuses,
  selectedPipelineRunStatus,
  onSelectedPipelineRunStatus,
  isFetching,
}: Props) => {
  if (!pipelineRunStatuses?.length || !onSelectedPipelineRunStatus) return null;

  return (
    <ToolbarItem>
      <FormGroup label="Status">
        <FormSelect
          id="status-selector"
          data-testid="status-selector"
          value={selectedPipelineRunStatus}
          onChange={(_e, value) => onSelectedPipelineRunStatus(value as string)}
          label="Status"
          isDisabled={isFetching}
        >
          <FormSelectOption value="All" key="All" label="All" />
          {pipelineRunStatuses.map(plrStatus => (
            <FormSelectOption
              key={plrStatus}
              value={plrStatus}
              label={plrStatus}
            />
          ))}
        </FormSelect>
      </FormGroup>
    </ToolbarItem>
  );
};

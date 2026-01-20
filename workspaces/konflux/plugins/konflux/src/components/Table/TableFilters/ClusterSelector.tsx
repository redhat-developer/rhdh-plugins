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
  clusters?: string[];
  selectedCluster?: string;
  onSelectedCluster?: (val: string) => void;
  isFetching: boolean;
};

export const ClusterSelector = ({
  clusters,
  selectedCluster,
  onSelectedCluster,
  isFetching,
}: Props) => {
  if (!clusters?.length || !onSelectedCluster) return null;

  return (
    <ToolbarItem>
      <FormGroup label="Cluster">
        <FormSelect
          id="cluster-selector"
          data-testid="cluster-selector"
          value={selectedCluster}
          onChange={(_e, value) => onSelectedCluster(value as string)}
          label="Cluster"
          isDisabled={isFetching}
        >
          <FormSelectOption value="All" key="All" label="All" />
          {clusters.map(cluster => (
            <FormSelectOption key={cluster} value={cluster} label={cluster} />
          ))}
        </FormSelect>
      </FormGroup>
    </ToolbarItem>
  );
};

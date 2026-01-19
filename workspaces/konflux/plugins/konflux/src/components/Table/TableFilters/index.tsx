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

import '@patternfly/react-core/dist/styles/base-no-reset.css';
import '@patternfly/patternfly/utilities/Accessibility/accessibility.css';

import { Toolbar, ToolbarContent } from '@patternfly/react-core';
import { SubcomponentSelector } from './SubcomponentSelector';
import { ClusterSelector } from './ClusterSelector';
import { ApplicationSelector } from './ApplicationSelector';
import { PipelineRunStatusSelector } from './PipelineRunStatusSelector';
import { PipelineRunTypeSelector } from './PipelineRunTypeSelector';
import { NameSearch } from './NameSearch';

type Props = {
  // subcomponents
  subcomponents?: string[];
  selectedSubcomponent?: string;
  onSelectedSubcomponent?: (val: string) => void;
  // clusters
  clusters?: string[];
  selectedCluster?: string;
  onSelectedCluster?: (val: string) => void;
  // applications
  applications?: string[];
  selectedApplication?: string;
  onSelectedApplication?: (val: string) => void;
  // pipeline run status
  pipelineRunStatuses?: string[];
  selectedPipelineRunStatus?: string;
  onSelectedPipelineRunStatus?: (val: string) => void;
  // pipeline runs type
  pipelineRunTypes?: string[];
  selectedPipelineRunType?: string;
  onSelectedPipelineRunType?: (val: string) => void;
  // name search
  nameSearch: string | undefined;
  onNameSearch: (val: string) => void;
  nameSearchPlaceholder: string;
  // misc
  isFetching: boolean;
};

export const TableFilters = ({
  subcomponents,
  selectedSubcomponent,
  onSelectedSubcomponent,
  clusters,
  selectedCluster,
  onSelectedCluster,
  applications,
  selectedApplication,
  onSelectedApplication,
  pipelineRunStatuses,
  selectedPipelineRunStatus,
  onSelectedPipelineRunStatus,
  pipelineRunTypes,
  onSelectedPipelineRunType,
  selectedPipelineRunType,
  nameSearch,
  nameSearchPlaceholder,
  onNameSearch,
  isFetching,
}: Props) => {
  return (
    <Toolbar>
      <ToolbarContent>
        <SubcomponentSelector
          subcomponents={subcomponents}
          selectedSubcomponent={selectedSubcomponent}
          onSelectedSubcomponent={onSelectedSubcomponent}
          isFetching={isFetching}
        />

        <ClusterSelector
          clusters={clusters}
          selectedCluster={selectedCluster}
          onSelectedCluster={onSelectedCluster}
          isFetching={isFetching}
        />

        <ApplicationSelector
          applications={applications}
          selectedApplication={selectedApplication}
          onSelectedApplication={onSelectedApplication}
          isFetching={isFetching}
        />

        <PipelineRunStatusSelector
          pipelineRunStatuses={pipelineRunStatuses}
          selectedPipelineRunStatus={selectedPipelineRunStatus}
          onSelectedPipelineRunStatus={onSelectedPipelineRunStatus}
          isFetching={isFetching}
        />

        <PipelineRunTypeSelector
          pipelineRunTypes={pipelineRunTypes}
          onSelectedPipelineRunType={onSelectedPipelineRunType}
          selectedPipelineRunType={selectedPipelineRunType}
          isFetching={isFetching}
        />

        <NameSearch
          nameSearch={nameSearch}
          onNameSearch={onNameSearch}
          isFetching={isFetching}
          placeholder={nameSearchPlaceholder}
        />
      </ToolbarContent>
    </Toolbar>
  );
};

export default TableFilters;

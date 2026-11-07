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

import { Box } from '@material-ui/core';
import {
  Artifact,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { ArtifactLink } from '../ArtifactLink';
import { EditMigrationPlanButton } from './EditMigrationPlanButton';

type MigrationPlanLinkProps = {
  artifact?: Artifact;
  targetRepoUrl: string;
  targetRepoBranch: string;
  /** The pencil is rendered only when the project is known. */
  project?: Project;
  /** Set when the artifact is the migration plan of a module. */
  moduleId?: string;
};

/**
 * Link to a migration plan document in the SCM followed by the edit pencil.
 * Both stay on one line, so the pencil never wraps away from the link.
 */
export const MigrationPlanLink = ({
  artifact,
  targetRepoUrl,
  targetRepoBranch,
  project,
  moduleId,
}: MigrationPlanLinkProps) => (
  <Box display="inline-flex" alignItems="center" flexWrap="nowrap">
    <ArtifactLink
      artifact={artifact}
      targetRepoUrl={targetRepoUrl}
      targetRepoBranch={targetRepoBranch}
    />
    {project && (
      <EditMigrationPlanButton
        project={project}
        artifact={artifact}
        moduleId={moduleId}
      />
    )}
  </Box>
);

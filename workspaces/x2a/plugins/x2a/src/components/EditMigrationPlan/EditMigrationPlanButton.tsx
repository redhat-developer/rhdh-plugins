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

import { useNavigate } from 'react-router-dom';
import { useRouteRef } from '@backstage/core-plugin-api';
import { Box, IconButton, Tooltip } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import {
  Artifact,
  Project,
  resolveScmProvider,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useProjectWriteAccess } from '../../hooks/useProjectWriteAccess';
import { useScmHostMap } from '../../hooks/useScmHostMap';
import { useTranslation } from '../../hooks/useTranslation';
import { modulePlanEditRouteRef, projectPlanEditRouteRef } from '../../routes';

export type EditMigrationPlanButtonProps = {
  project: Project;
  /** The migration plan artifact the button edits. Nothing is rendered without it. */
  artifact?: Artifact;
  /** Set when the artifact is the migration plan of a module, not of the project. */
  moduleId?: string;
};

/**
 * Pencil next to the link to a migration plan document in the SCM.
 *
 * It is not rendered for users who may not write the project (same as the
 * project edit button). It is disabled, with an explanation, for repositories
 * the document can not be written to directly (Bitbucket).
 */
export const EditMigrationPlanButton = ({
  project,
  artifact,
  moduleId,
}: EditMigrationPlanButtonProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canWriteProject } = useProjectWriteAccess();
  const hostMap = useScmHostMap();
  const projectPlanEditPath = useRouteRef(projectPlanEditRouteRef);
  const modulePlanEditPath = useRouteRef(modulePlanEditRouteRef);

  if (!artifact || !canWriteProject(project)) {
    return null;
  }

  const unsupported =
    resolveScmProvider(project.targetRepoUrl, hostMap).name === 'bitbucket';
  const label = unsupported
    ? t('editMigrationPlan.button.bitbucketUnsupported')
    : t('editMigrationPlan.button.edit');

  const onClick = () =>
    navigate(
      moduleId
        ? modulePlanEditPath({ projectId: project.id, moduleId })
        : projectPlanEditPath({ projectId: project.id }),
    );

  return (
    <Tooltip title={label}>
      {/* a disabled button does not emit the events the tooltip listens to */}
      <Box display="inline-flex" ml={0.5}>
        <IconButton
          size="small"
          aria-label={label}
          disabled={unsupported}
          onClick={onClick}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
    </Tooltip>
  );
};

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

import { useAsync } from 'react-use';

import { useApi } from '@backstage/core-plugin-api';
import { useTranslationRef } from '@backstage/frontend-plugin-api';
import { scaffolderReactTranslationRef } from '@backstage/plugin-scaffolder-react';

import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import type { TemplateCardActionProps } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';

import { orchestratorApiRef } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import {
  getWorkflowIdFromTemplate,
  isOrchestratorWorkflowTemplate,
} from '../../utils/getWorkflowIdFromTemplate';
import { WorkflowUnavailableTooltip } from '../ui/WorkflowUnavailableTooltip';

export const OrchestratorTemplateCardChooseButton = ({
  template,
  onSelected,
  canCreateTask,
}: TemplateCardActionProps) => {
  const { t: scaffolderT } = useTranslationRef(scaffolderReactTranslationRef);
  const { t } = useTranslation();
  const orchestratorApi = useApi(orchestratorApiRef);
  const chooseLabel = scaffolderT('templateCard.chooseButtonText');
  const workflowId = getWorkflowIdFromTemplate(template);
  const isOrchestratorTemplate = isOrchestratorWorkflowTemplate(template);

  const {
    value: overviewResponse,
    loading,
    error: overviewError,
  } = useAsync(async () => {
    if (!workflowId) {
      return undefined;
    }
    return orchestratorApi.getWorkflowOverview(workflowId);
  }, [workflowId, orchestratorApi]);

  if (!isOrchestratorTemplate) {
    if (!canCreateTask) {
      return null;
    }

    return (
      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={onSelected}
      >
        {chooseLabel}
      </Button>
    );
  }

  const isUnavailable = overviewResponse?.data.isAvailable === false;
  const availability = overviewResponse?.data.availability;
  const disabled =
    !canCreateTask || loading || isUnavailable || Boolean(overviewError);

  let tooltipText = '';
  if (!canCreateTask) {
    tooltipText = t('workflow.messages.userNotAuthorizedExecute');
  } else if (isUnavailable) {
    tooltipText = t('workflow.unavailable.runTooltip');
  }

  const button = (
    <Button
      size="small"
      variant="outlined"
      color="primary"
      disabled={disabled}
      onClick={onSelected}
    >
      {chooseLabel}
    </Button>
  );

  if (isUnavailable && availability) {
    return (
      <WorkflowUnavailableTooltip availability={availability}>
        {button}
      </WorkflowUnavailableTooltip>
    );
  }

  return (
    <Tooltip title={tooltipText} disableHoverListener={!tooltipText}>
      <span>{button}</span>
    </Tooltip>
  );
};

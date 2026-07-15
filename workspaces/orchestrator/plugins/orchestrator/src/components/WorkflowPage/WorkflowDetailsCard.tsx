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

import { InfoCard, Link } from '@backstage/core-components';
import { AboutField } from '@backstage/plugin-catalog';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import { makeStyles } from 'tss-react/mui';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../../constants';
import WorkflowOverviewFormatter from '../../dataFormatters/WorkflowOverviewFormatter';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDuration } from '../../utils/DurationUtils';
import { WorkflowStatus } from '../ui/WorkflowStatus';

export type WorkflowDetailsLayout = 'default' | 'entity';

const useStyles = makeStyles<{ layout: WorkflowDetailsLayout }>()(
  (_, { layout }) => ({
    details: {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      overflowX: 'hidden',
      overflowY: 'auto',
      minHeight: layout === 'entity' ? undefined : '10rem',
      maxHeight: layout === 'entity' ? undefined : '15rem',
    },
    entityFieldGrid: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'flex-start',
      gap: 24,
      minWidth: 0,
      width: '100%',
      overflowX: 'auto',
    },
    entityFieldItem: {
      flex: '1 1 0',
      minWidth: 0,
    },
    entityDescriptionItem: {
      flex: '1.5 1 0',
      minWidth: 0,
    },
    defaultFieldGrid: {
      minWidth: 0,
      width: '100%',
    },
  }),
);

const WorkflowDefinitionDetailsCard = ({
  loading,
  workflowOverview,
  entityName,
  entityCatalogLink,
  layout = 'default',
}: {
  loading: boolean;
  workflowOverview?: WorkflowOverviewDTO;
  entityName?: string;
  entityCatalogLink?: string;
  layout?: WorkflowDetailsLayout;
}) => {
  const { t } = useTranslation();
  const { classes } = useStyles({ layout });

  const formattedWorkflowOverview = useMemo(
    () =>
      workflowOverview
        ? WorkflowOverviewFormatter.format(workflowOverview)
        : undefined,
    [workflowOverview],
  );

  const averageDuration = useMemo(() => {
    if (loading || layout !== 'entity') {
      return undefined;
    }
    const averageTimeToComplete =
      workflowOverview?.workflowRunStats?.averageTimeToComplete;
    if (averageTimeToComplete === undefined) {
      return VALUE_UNAVAILABLE;
    }
    return formatDuration(averageTimeToComplete, t);
  }, [loading, workflowOverview, layout, t]);

  const averageDurationField = (
    <AboutField
      label={t('workflow.fields.averageDuration')}
      value={averageDuration}
    >
      {loading ? <Skeleton variant="text" /> : averageDuration}
    </AboutField>
  );

  const workflowStatusField = (
    <AboutField
      label={t('workflow.fields.workflowStatus')}
      value={formattedWorkflowOverview?.availability}
    >
      {loading ? (
        <Skeleton variant="text" />
      ) : (
        <b>
          <WorkflowStatus
            availability={formattedWorkflowOverview?.availability}
            availabilityDetails={workflowOverview?.availability}
          />
        </b>
      )}
    </AboutField>
  );

  const versionField = (
    <AboutField
      label={t('workflow.fields.version')}
      value={formattedWorkflowOverview?.version}
    >
      {loading ? (
        <Skeleton variant="text" />
      ) : (
        formattedWorkflowOverview?.version
      )}
    </AboutField>
  );

  const descriptionField = (
    <AboutField
      label={t('workflow.fields.description')}
      value={formattedWorkflowOverview?.description}
    >
      {loading ? (
        <Skeleton variant="text" />
      ) : (
        formattedWorkflowOverview?.description
      )}
    </AboutField>
  );

  return (
    <InfoCard title={t('workflow.details')} className={classes.details}>
      {layout === 'entity' ? (
        <Box className={classes.entityFieldGrid}>
          {entityName && entityCatalogLink ? (
            <Box className={classes.entityFieldItem}>
              <AboutField
                label={t('workflow.fields.entity')}
                value={entityName}
              >
                {loading ? (
                  <Skeleton variant="text" />
                ) : (
                  <Link to={entityCatalogLink}>{entityName}</Link>
                )}
              </AboutField>
            </Box>
          ) : null}
          <Box className={classes.entityFieldItem}>{averageDurationField}</Box>
          <Box className={classes.entityFieldItem}>{workflowStatusField}</Box>
          <Box className={classes.entityFieldItem}>{versionField}</Box>
          <Box className={classes.entityDescriptionItem}>
            {descriptionField}
          </Box>
        </Box>
      ) : (
        <Grid container spacing={2} className={classes.defaultFieldGrid}>
          {entityName && entityCatalogLink ? (
            <Grid item xs={12} sm={6}>
              <AboutField
                label={t('workflow.fields.entity')}
                value={entityName}
              >
                {loading ? (
                  <Skeleton variant="text" />
                ) : (
                  <Link to={entityCatalogLink}>{entityName}</Link>
                )}
              </AboutField>
            </Grid>
          ) : null}
          <Grid item xs={12} sm={6}>
            {workflowStatusField}
          </Grid>
          <Grid item xs={12} sm={6}>
            {versionField}
          </Grid>
          <Grid item xs={12}>
            {descriptionField}
          </Grid>
        </Grid>
      )}
    </InfoCard>
  );
};

export default WorkflowDefinitionDetailsCard;

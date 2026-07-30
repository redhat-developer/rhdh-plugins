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

import { EmptyState, LinkButton } from '@backstage/core-components';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Button from '@mui/material/Button';
import { makeStyles } from 'tss-react/mui';

import {
  BUILD_WORKFLOWS_DOC_URL,
  RUN_WORKFLOW_SCAFFOLDER_URL,
} from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import emptyStateIllustration from '../../images/empty-state.png';

const useStyles = makeStyles()(theme => ({
  root: {
    width: '100%',
    containerType: 'inline-size',
    '& [class*="BackstageEmptyState-root"]': {
      alignItems: 'center',
      padding: theme.spacing(4),
    },
    '& [class*="MuiTypography-h5"]': {
      fontSize: 'clamp(1.875rem, 3.75cqi, 3.125rem)',
      fontWeight: 400,
    },
    '& [class*="MuiTypography-body1"]': {
      fontSize: '1em',
      color: theme.palette.text.secondary,
    },
    '@container (max-width: 899px)': {
      '& [class*="BackstageEmptyState-root"]': {
        textAlign: 'center',
      },
      '& [class*="MuiGrid-grid-md-6"]': {
        maxWidth: '100%',
        flexBasis: '100%',
      },
      '& [class*="BackstageEmptyState-imageContainer"]': {
        order: -1,
        display: 'flex',
        justifyContent: 'center',
        marginBottom: theme.spacing(-4),
      },
    },
  },
  illustration: {
    width: 'clamp(200px, 50cqi, 600px)',
    maxWidth: '100%',
    height: 'auto',
  },
  externalLinkIcon: {
    marginLeft: theme.spacing(0.5),
    fontSize: '1em',
    verticalAlign: 'text-bottom',
  },
}));

const EmptyStateIllustration = () => {
  const { t } = useTranslation();
  const { classes } = useStyles();

  return (
    <img
      src={emptyStateIllustration}
      alt={t('emptyState.illustrationAlt')}
      className={classes.illustration}
    />
  );
};

export type OrchestratorEmptyStateVariant = 'workflows' | 'runs';

export type OrchestratorEmptyStateProps = {
  variant: OrchestratorEmptyStateVariant;
  runWorkflowUrl?: string;
};

export const OrchestratorEmptyState = ({
  variant,
  runWorkflowUrl = RUN_WORKFLOW_SCAFFOLDER_URL,
}: OrchestratorEmptyStateProps) => {
  const { t } = useTranslation();
  const { classes } = useStyles();

  const title =
    variant === 'workflows'
      ? t('emptyState.workflows.title')
      : t('emptyState.runs.title');

  const description =
    variant === 'workflows'
      ? t('emptyState.workflows.description')
      : t('emptyState.runs.description');

  const action =
    variant === 'workflows' ? (
      <Button
        variant="outlined"
        color="primary"
        href={BUILD_WORKFLOWS_DOC_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('emptyState.workflows.viewDocumentation')}
        <OpenInNewIcon className={classes.externalLinkIcon} aria-hidden />
      </Button>
    ) : (
      <LinkButton variant="contained" color="primary" to={runWorkflowUrl}>
        {t('emptyState.runs.runWorkflow')}
      </LinkButton>
    );

  return (
    <div className={classes.root}>
      <EmptyState
        title={title}
        description={description}
        missing={{ customImage: <EmptyStateIllustration /> }}
        action={action}
      />
    </div>
  );
};

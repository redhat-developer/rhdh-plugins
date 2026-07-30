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

import { FC, useMemo } from 'react';

import {
  InfoCard,
  Progress,
  ResponseErrorPanel,
  StructuredMetadataTable,
} from '@backstage/core-components';

import { makeStyles } from 'tss-react/mui';

import { useTranslation } from '../../hooks/useTranslation';
import { formatMetadataForDisplay } from '../../utils/formatMetadataForDisplay';

const useStyles = makeStyles()(() => ({
  metadataTable: {
    minWidth: 0,
    maxWidth: '100%',
    overflowX: 'auto',
    '& table': {
      tableLayout: 'fixed',
      width: '100%',
    },
    '& td': {
      wordBreak: 'break-word',
      whiteSpace: 'normal',
    },
  },
}));

export const WorkflowInputs: FC<{
  className: string;
  value: any;
  loading: any;
  responseError: any;
  cardClassName: string;
}> = ({ className, value, loading, responseError, cardClassName }) => {
  const { t } = useTranslation();
  const { classes } = useStyles();
  const inputs = value?.data;
  const displayInputs = useMemo(
    () => (inputs ? formatMetadataForDisplay(inputs) : inputs),
    [inputs],
  );
  return (
    <InfoCard
      title={t('run.inputs')}
      subheader={
        !loading &&
        !responseError &&
        !inputs && <i>{t('messages.workflowInstanceNoInputs')}</i>
      }
      divider={false}
      className={className}
      cardClassName={cardClassName}
    >
      {loading ? <Progress /> : null}

      {!loading && responseError && (
        <ResponseErrorPanel error={responseError} />
      )}

      {!loading && !responseError && displayInputs && (
        <div className={classes.metadataTable}>
          <StructuredMetadataTable dense metadata={displayInputs} />
        </div>
      )}
    </InfoCard>
  );
};
WorkflowInputs.displayName = 'WorkflowInputs';

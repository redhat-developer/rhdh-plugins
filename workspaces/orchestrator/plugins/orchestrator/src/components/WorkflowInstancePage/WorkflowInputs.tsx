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

import { FC } from 'react';

import {
  InfoCard,
  Progress,
  ResponseErrorPanel,
  StructuredMetadataTable,
} from '@backstage/core-components';

import { useTranslation } from '../../hooks/useTranslation';

export const WorkflowInputs: FC<{
  className: string;
  value: any;
  loading: any;
  responseError: any;
  cardClassName: string;
}> = ({ className, value, loading, responseError, cardClassName }) => {
  const { t } = useTranslation();
  const inputs = value?.data;
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

      {!loading && !responseError && inputs && (
        <StructuredMetadataTable dense metadata={inputs} />
      )}
    </InfoCard>
  );
};
WorkflowInputs.displayName = 'WorkflowInputs';

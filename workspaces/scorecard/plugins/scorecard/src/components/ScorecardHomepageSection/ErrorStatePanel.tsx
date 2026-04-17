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
import { ResponseErrorPanel } from '@backstage/core-components';
import { useTranslation } from '../../hooks/useTranslation';
import { EmptyStatePanel } from './EmptyStatePanel';
import { useMetricDisplayLabels } from '../../hooks/useMetricDisplayLabels';
import { CardLoading } from '../Common/CardLoading';
import { useAggregationMetadata } from '../../hooks/useAggregationMetadata';

export const ErrorStatePanel = ({
  error,
  aggregationId,
  showSubheader = true,
  cardDataTestId,
}: {
  error: Error;
  aggregationId: string;
  showSubheader?: boolean;
  cardDataTestId?: string;
}) => {
  const { t } = useTranslation();

  const {
    data,
    isLoading,
    error: metadataError,
  } = useAggregationMetadata({ aggregationId });

  const { title: cardTitle, description: cardDescription } =
    useMetricDisplayLabels({
      id: aggregationId,
      title: data?.title ?? '',
      description: data?.description ?? '',
    });

  const getErrorPanelContent = useMemo(() => {
    const isMissingPermission = error.message?.includes('NotAllowedError');
    if (isMissingPermission) {
      return {
        label: t('errors.missingPermission'),
        tooltipContent: t('errors.missingPermissionMessage'),
      };
    }

    const isUserNotFoundInCatalog =
      error.message?.includes('NotFoundError') &&
      error.message?.includes('User entity not found in catalog');
    if (isUserNotFoundInCatalog) {
      return {
        label: t('errors.metricDataUnavailable'),
        tooltipContent: t('errors.userNotFoundInCatalogMessage'),
      };
    }

    const isAuthenticationError = error.message?.includes(
      'AuthenticationError',
    );
    if (isAuthenticationError) {
      return {
        label: t('errors.authenticationError'),
        tooltipContent: t('errors.authenticationErrorMessage'),
      };
    }

    return { label: '', tooltipContent: '' };
  }, [error, t]);

  if (isLoading) {
    return <CardLoading dataTestId={cardDataTestId} />;
  }

  if (metadataError) {
    return <ResponseErrorPanel error={metadataError} />;
  }

  const { label, tooltipContent } = getErrorPanelContent;

  if (label && tooltipContent) {
    return (
      <EmptyStatePanel
        label={label}
        cardTitle={cardTitle}
        cardDescription={cardDescription}
        tooltipContent={tooltipContent}
        showSubheader={showSubheader}
        dataTestId={cardDataTestId}
      />
    );
  }

  return <ResponseErrorPanel error={error} />;
};

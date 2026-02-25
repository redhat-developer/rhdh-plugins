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

import { ResponseErrorPanel } from '@backstage/core-components';
import { useTranslation } from '../../hooks/useTranslation';
import { EmptyStatePanel } from './EmptyStatePanel';
import { CardLoading } from '../CardLoading';
import { useMetrics } from '../../hooks/useMetrics';
import { useMetricDisplayLabels } from '../../hooks/useMetricDisplayLabels';

export const ErrorStatePanel = ({
  error,
  metricId,
}: {
  error: Error;
  metricId: string;
}) => {
  const { t } = useTranslation();

  const { metrics, loading, error: metricsError } = useMetrics({ metricId });

  const { title: cardTitle, description: cardDescription } =
    useMetricDisplayLabels(metrics[0]);

  if (loading) {
    return <CardLoading />;
  }

  if (metricsError || metrics.length !== 1) {
    return (
      <ResponseErrorPanel
        error={metricsError || new Error('Multiple metrics found')}
      />
    );
  }

  const getPanelContent = () => {
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
  };

  const { label, tooltipContent } = getPanelContent();

  if (label && tooltipContent) {
    return (
      <EmptyStatePanel
        label={label}
        cardTitle={cardTitle}
        cardDescription={cardDescription}
        tooltipContent={tooltipContent}
      />
    );
  }

  return <ResponseErrorPanel error={error} />;
};

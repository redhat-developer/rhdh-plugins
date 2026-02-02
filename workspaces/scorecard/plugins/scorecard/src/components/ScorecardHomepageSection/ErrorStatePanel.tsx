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

export const ErrorStatePanel = ({
  error,
  metricId,
}: {
  error: Error;
  metricId: string;
}) => {
  const { t } = useTranslation();

  const isMissingPermission = error.message?.includes('NotAllowedError');

  if (isMissingPermission) {
    return (
      <EmptyStatePanel
        metricId={metricId}
        label={t('errors.missingPermission')}
        tooltipContent={t('errors.missingPermissionMessage')}
      />
    );
  }

  const isUserNotFoundInCatalog =
    error.message?.includes('NotFoundError') &&
    error.message?.includes('User entity not found in catalog');

  if (isUserNotFoundInCatalog) {
    return (
      <EmptyStatePanel
        metricId={metricId}
        label={t('errors.metricDataUnavailable')}
        tooltipContent={t('errors.userNotFoundInCatalogMessage')}
      />
    );
  }

  const isAuthenticationError = error.message?.includes('AuthenticationError');

  if (isAuthenticationError) {
    return (
      <EmptyStatePanel
        metricId={metricId}
        label={t('errors.authenticationError')}
        tooltipContent={t('errors.authenticationErrorMessage')}
      />
    );
  }

  return <ResponseErrorPanel error={error} />;
};

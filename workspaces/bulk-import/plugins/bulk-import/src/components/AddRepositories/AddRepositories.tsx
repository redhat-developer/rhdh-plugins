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

import { CodeSnippet, Link } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { Alert, Box, Flex, Text } from '@backstage/ui';

import { useFormikContext } from 'formik';

import { useImportFlow } from '../../hooks/useImportFlow';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  ErrorType,
  ImportFlow,
  PullRequestPreviewData,
} from '../../types';
import { getImageForIconClass } from '../../utils/icons';
import { getCustomisedErrorMessage } from '../../utils/repository-utils';
import {
  BulkImportExternalLinkIcon,
  bulkImportExternalLinkLinkStyle,
} from '../bulkImportIcons';
import { bulkImportTypographyH3 } from '../bulkImportTypography';
import { useDrawer } from '../DrawerContext';
import { PreviewFileSidebar } from '../PreviewFile/PreviewFileSidebar';
import { AddRepositoriesFormFooter } from './AddRepositoriesFormFooter';
import { AddRepositoriesTable } from './AddRepositoriesTable';

export const AddRepositories = ({ error }: { error?: any }) => {
  const { t } = useTranslation();
  const configApi = useApi(configApiRef);
  const importFlow = useImportFlow();
  const { openDrawer, setOpenDrawer, drawerData } = useDrawer();
  const { setFieldValue, values, status } =
    useFormikContext<AddRepositoriesFormValues>();
  const jobErrors = (status?.errors as ErrorType) || {};
  const showOrchestratorJobErrors =
    importFlow === ImportFlow.Orchestrator && Object.keys(jobErrors).length > 0;

  // Check if integrations are configured
  const hasGitHubIntegration = configApi.has('integrations.github');
  const hasGitLabIntegration = configApi.has('integrations.gitlab');
  const hasMissingIntegrations = !hasGitHubIntegration && !hasGitLabIntegration;

  // Parse error message if it exists and is valid JSON
  const errorMessage = (() => {
    try {
      return error?.error?.message ? JSON.parse(error.error.message) : null;
    } catch {
      // If parsing fails, return null and use the raw error message
      return null;
    }
  })();

  const closeDrawer = () => {
    setOpenDrawer(false);
  };

  const handleSave = (pullRequest: PullRequestPreviewData, _event: any) => {
    Object.keys(pullRequest).forEach(pr => {
      setFieldValue(
        `repositories.${pr}.catalogInfoYaml.prTemplate`,
        pullRequest[pr],
      );
    });
    setOpenDrawer(false);
  };

  // Show missing configuration page if no integrations are configured
  if (hasMissingIntegrations) {
    return (
      <Flex
        style={{
          minHeight: '50vh',
          padding: '24px',
          paddingLeft: '48px',
        }}
      >
        <Box style={{ flex: '0.8', paddingRight: '16px', paddingTop: '64px' }}>
          <Box style={{ marginBottom: '16px', paddingTop: '96px' }}>
            <Text as="h1" style={bulkImportTypographyH3}>
              {t('status.missingConfigurations')}
            </Text>
            <Text
              variant="body-medium"
              style={{ lineHeight: 1.5, margin: '0 0 1rem 0' }}
            >
              {t('errors.noIntegrationsConfigured')}
            </Text>
            <Text
              variant="body-medium"
              style={{ lineHeight: 1.5, margin: '0 0 2rem 0' }}
            >
              {t('errors.addIntegrationsToConfig')}
            </Text>
            <CodeSnippet
              text={`integrations:
  github:
    - host: github.com
      token: \${GITHUB_TOKEN}
  # or
  gitlab:
    - host: gitlab.com
      token: \${GITLAB_TOKEN}`}
              language="yaml"
              showCopyCodeButton
              customStyle={{
                marginBottom: '1rem',
                fontSize: '0.875rem',
              }}
            />
            <Link
              to="https://backstage.io/docs/integrations/#configuration"
              target="_blank"
              rel="noopener noreferrer"
              style={bulkImportExternalLinkLinkStyle}
            >
              {t('common.documentation')}
              <BulkImportExternalLinkIcon />
            </Link>
          </Box>
        </Box>

        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <img
            src={getImageForIconClass('missing-configuration')}
            alt="Missing configuration"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              opacity: 0.8,
              objectFit: 'contain',
            }}
          />
        </Flex>
      </Flex>
    );
  }

  return (
    <>
      <div style={{ width: '100%' }}>
        <div
          style={{
            marginBottom: '50px',
            padding: '24px',
          }}
        >
          {error && (
            <div style={{ paddingBottom: '10px' }}>
              <Alert
                status="danger"
                icon
                title={
                  errorMessage?.error?.name ??
                  error?.error?.name ??
                  error?.name ??
                  t('errors.errorOccurred')
                }
                description={
                  errorMessage?.error?.message ??
                  error?.error?.message ??
                  error?.message ??
                  error?.err ??
                  t('errors.failedToCreatePullRequest')
                }
              />
            </div>
          )}
          {showOrchestratorJobErrors && (
            <div
              style={{ paddingBottom: '10px' }}
              data-testid="orchestrator-job-errors"
            >
              {Object.entries(jobErrors).map(([repoId, jobError]) => {
                const { message } = getCustomisedErrorMessage(
                  jobError.error.message,
                  (key: string) => t(key as any, {}),
                );
                const repoLabel = [
                  jobError.repository.organization,
                  jobError.repository.name,
                ]
                  .filter(Boolean)
                  .join('/');
                return (
                  <div
                    key={repoId}
                    style={{ marginBottom: '8px' }}
                    data-testid={`orchestrator-job-error-${repoId}`}
                  >
                    <Alert
                      status="danger"
                      icon
                      title={repoLabel || t('errors.errorOccurred')}
                      description={message}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <AddRepositoriesTable />
        </div>
        <br />
      </div>
      <AddRepositoriesFormFooter />
      {openDrawer && (
        <PreviewFileSidebar
          open={openDrawer}
          onClose={closeDrawer}
          data={drawerData}
          repositoryType={values.repositoryType}
          handleSave={handleSave}
        />
      )}
    </>
  );
};

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

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoriesFormValues, PullRequestPreviewData } from '../../types';
import { getImageForIconClass } from '../../utils/icons';
import { useDrawer } from '../DrawerContext';
import { PreviewFileSidebar } from '../PreviewFile/PreviewFileSidebar';
import { AddRepositoriesFormFooter } from './AddRepositoriesFormFooter';
import { AddRepositoriesTable } from './AddRepositoriesTable';

export const AddRepositories = ({ error }: { error?: any }) => {
  const { t } = useTranslation();
  const configApi = useApi(configApiRef);
  const { openDrawer, setOpenDrawer, drawerData } = useDrawer();
  const { setFieldValue, values } =
    useFormikContext<AddRepositoriesFormValues>();

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
      <Box
        sx={{ display: 'flex', minHeight: '50vh', padding: 3, paddingLeft: 6 }}
      >
        <Box sx={{ flex: 0.8, pr: 2, pt: 8, pl: 3 }}>
          <Box sx={{ mb: 2, pt: 12 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontSize: '2rem',
                fontWeight: 400,
                margin: '0 0 1rem 0',
              }}
            >
              {t('status.missingConfigurations')}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                lineHeight: '1.5',
                margin: '0 0 1rem 0',
              }}
            >
              {t('errors.noIntegrationsConfigured')}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                lineHeight: '1.5',
                margin: '0 0 2rem 0',
              }}
            >
              {t('errors.addIntegrationsToConfig')}
            </Typography>
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
            >
              {t('common.documentation')}
              <OpenInNewIcon
                style={{ verticalAlign: 'sub', paddingTop: '7px' }}
              />
            </Link>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
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
        </Box>
      </Box>
    );
  }

  return (
    <>
      <FormControl fullWidth>
        <div
          style={{
            marginBottom: '50px',
            padding: '24px',
          }}
        >
          {error && (
            <div style={{ paddingBottom: '10px' }}>
              <Alert severity="error">
                <AlertTitle>
                  {errorMessage?.error?.name ??
                    error?.error?.name ??
                    error?.name ??
                    t('errors.errorOccurred')}
                </AlertTitle>
                {errorMessage?.error?.message ??
                  error?.error?.message ??
                  error?.message ??
                  error?.err ??
                  t('errors.failedToCreatePullRequest')}
              </Alert>
            </div>
          )}
          <AddRepositoriesTable />
        </div>
        <br />
      </FormControl>
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

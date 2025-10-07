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

import { Content, Header, Page, Progress } from '@backstage/core-components';
import { usePermission } from '@backstage/plugin-permission-react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { bulkImportPermission } from '@red-hat-developer-hub/backstage-plugin-bulk-import-common';

import { useTranslation } from '../../hooks/useTranslation';
import { gitlabFeatureFlag } from '../../utils/repository-utils';
import { AddRepositoriesForm } from './AddRepositoriesForm';
import { Illustrations } from './Illustrations';

export const AddRepositoriesPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const bulkImportViewPermissionResult = usePermission({
    permission: bulkImportPermission,
    resourceRef: bulkImportPermission.resourceType,
  });

  const showContent = () => {
    if (bulkImportViewPermissionResult.loading) {
      return <Progress />;
    }
    if (bulkImportViewPermissionResult.allowed) {
      return (
        <>
          <div style={{ padding: '24px' }}>
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                id="add-repository-summary"
              >
                <Typography variant="h5">
                  {gitlabFeatureFlag
                    ? t('page.importEntitiesSubtitle')
                    : t('page.addRepositoriesSubtitle')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  flexDirection: 'row',
                  display: 'flex',
                  justifyContent: 'space-around',
                  overflow: 'auto',
                }}
              >
                {gitlabFeatureFlag && (
                  <Illustrations
                    iconClassname={
                      theme.palette.mode === 'dark'
                        ? 'icon-approval-tool-white'
                        : 'icon-approval-tool-black'
                    }
                    iconText={t('steps.chooseApprovalTool')}
                  />
                )}
                <Illustrations
                  iconClassname={
                    theme.palette.mode === 'dark'
                      ? 'icon-choose-repositories-white'
                      : 'icon-choose-repositories-black'
                  }
                  iconText={
                    gitlabFeatureFlag
                      ? t('steps.chooseItems')
                      : t('steps.chooseRepositories')
                  }
                />
                <Illustrations
                  iconClassname={
                    theme.palette.mode === 'dark'
                      ? 'icon-generate-cataloginfo-white'
                      : 'icon-generate-cataloginfo-black'
                  }
                  iconText={
                    gitlabFeatureFlag
                      ? t('steps.generateCatalogInfoItems')
                      : t('steps.generateCatalogInfo')
                  }
                />
                <Illustrations
                  iconClassname={
                    theme.palette.mode === 'dark'
                      ? 'icon-edit-pullrequest-white'
                      : 'icon-edit-pullrequest-black'
                  }
                  iconText={t('steps.editPullRequest')}
                />
                <Illustrations
                  iconClassname={
                    theme.palette.mode === 'dark'
                      ? 'icon-track-status-white'
                      : 'icon-track-status-black'
                  }
                  iconText={t('steps.trackStatus')}
                />
              </AccordionDetails>
            </Accordion>
          </div>
          <AddRepositoriesForm />
        </>
      );
    }
    return (
      <div style={{ padding: '24px' }}>
        <Alert severity="warning" data-testid="no-permission-alert">
          <AlertTitle>{t('permissions.title')}</AlertTitle>
          {t('permissions.addRepositoriesMessage')}
        </Alert>
      </div>
    );
  };
  return (
    <Page themeId="tool">
      <Header
        title={
          gitlabFeatureFlag
            ? t('page.importEntitiesTitle')
            : t('page.addRepositoriesTitle')
        }
        type={t('page.typeLink')}
        typeLink=".."
      />
      <Content noPadding>{showContent()}</Content>
    </Page>
  );
};

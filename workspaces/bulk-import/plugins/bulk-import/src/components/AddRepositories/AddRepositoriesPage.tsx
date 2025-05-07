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

import { useRef } from 'react';

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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { bulkImportPermission } from '@red-hat-developer-hub/backstage-plugin-bulk-import-common';

import { gitlabFeatureFlag } from '../../utils/repository-utils';
import { AddRepositoriesForm } from './AddRepositoriesForm';
import { Illustrations } from './Illustrations';

export const AddRepositoriesPage = () => {
  const queryClientRef = useRef<QueryClient>();
  const theme = useTheme();

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

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
                    ? 'Import to Red Hat Developer Hub'
                    : 'Add repositories to Red Hat Developer Hub in 4 steps'}
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
                    iconText="Choose approval tool (GitHub/GitLab) for PR creation"
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
                      ? 'Choose which items you want to import'
                      : 'Choose repositories you want to add'
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
                      ? 'Generate a catalog-info.yaml file for each selected item'
                      : 'Generate a catalog-info.yaml file for each repository'
                  }
                />
                <Illustrations
                  iconClassname={
                    theme.palette.mode === 'dark'
                      ? 'icon-edit-pullrequest-white'
                      : 'icon-edit-pullrequest-black'
                  }
                  iconText="Edit the pull request details if needed"
                />
                <Illustrations
                  iconClassname={
                    theme.palette.mode === 'dark'
                      ? 'icon-track-status-white'
                      : 'icon-track-status-black'
                  }
                  iconText="Track the approval status"
                />
              </AccordionDetails>
            </Accordion>
          </div>
          <QueryClientProvider client={queryClientRef.current as QueryClient}>
            <AddRepositoriesForm />
          </QueryClientProvider>
        </>
      );
    }
    return (
      <div style={{ padding: '24px' }}>
        <Alert severity="warning" data-testid="no-permission-alert">
          <AlertTitle>Permission required</AlertTitle>
          To add repositories, contact your administrator to give you the
          `bulk.import` permission.
        </Alert>
      </div>
    );
  };
  return (
    <Page themeId="tool">
      <Header
        title={gitlabFeatureFlag ? 'Import entities' : 'Add repositories'}
        type="Bulk import"
        typeLink=".."
      />
      <Content noPadding>{showContent()}</Content>
    </Page>
  );
};

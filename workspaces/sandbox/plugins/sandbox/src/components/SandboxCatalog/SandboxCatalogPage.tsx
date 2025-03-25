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
import React from 'react';
import Box from '@mui/material/Box';
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@material-ui/core/styles';
import { Page, Content } from '@backstage/core-components';
import { SandboxCatalogBanner } from './SandboxCatalogBanner';
import { SandboxCatalogGrid } from './SandboxCatalogGrid';
import { SandboxCatalogFooter } from './SandboxCatalogFooter';
import { SandboxProvider } from '../../hooks/useSandboxContext';
import { SandboxHeader } from '../SandboxHeader';

const useStyles = makeStyles((theme: Theme) => ({
  content: {
    backgroundColor: theme.palette.background.default,
  },
}));

export const SandboxCatalogPage = () => {
  const classes = useStyles();

  return (
    <SandboxProvider>
      <Page themeId="sandbox">
        <SandboxHeader pageTitle="Developer Sandbox" showSubTitle />
        <Content className={classes.content} noPadding>
          <SandboxCatalogBanner />
          <Box style={{ padding: '48px 60px 48px 60px' }}>
            <SandboxCatalogGrid />
          </Box>
          <SandboxCatalogFooter />
        </Content>
      </Page>
    </SandboxProvider>
  );
};

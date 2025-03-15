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

import { Content, Page } from '@backstage/core-components';
import Masonry from '@mui/lab/Masonry';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import InsightsHeader from '../Header';
import CatalogEntities from '../CatalogEntities';
import Templates from '../Templates';
import Techdocs from '../Techdocs';
import ActiveUsers from '../ActiveUsers';
import Plugins from '../Plugins';
import Searches from '../Searches';
import Users from '../Users';
import { DateRangeProvider } from '../Header/DateRangeContext';

export const AdoptionInsightsPage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <DateRangeProvider>
      <Page themeId="home">
        <InsightsHeader title="Insights" />
        <Content>
          <Masonry columns={isSmallScreen ? 1 : 2} spacing={2}>
            <ActiveUsers />
            <Users />
            <Templates />
            <CatalogEntities />
            <Plugins />
            <Techdocs />
            <Searches />
          </Masonry>
        </Content>
      </Page>
    </DateRangeProvider>
  );
};

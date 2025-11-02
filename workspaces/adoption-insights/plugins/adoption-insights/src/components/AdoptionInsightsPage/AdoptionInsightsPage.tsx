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
import { useAdoptionInsightsEventsReadPermission } from '../../hooks/useAdoptionInsightsEventsReadPermission';
import PermissionRequiredState from '../Common/PermissionRequiredState';
import { useTranslation } from '../../hooks/useTranslation';

export const AdoptionInsightsPage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const { allowed: hasEventsReadPermission, loading } =
    useAdoptionInsightsEventsReadPermission();
  const { t } = useTranslation();

  if (loading) {
    return null;
  }

  const getColumns = () => {
    if (isSmallScreen) return 1;
    if (isMediumScreen) return 1;
    if (isLargeScreen) return 2;
    return 1;
  };

  return (
    <Page themeId="home">
      {!hasEventsReadPermission ? (
        <Content>
          <PermissionRequiredState />
        </Content>
      ) : (
        <DateRangeProvider>
          <InsightsHeader title={t('page.title')} />
          <Content>
            <Masonry columns={getColumns()} spacing={2}>
              <ActiveUsers />
              <Users />
              <Templates />
              <CatalogEntities />
              <Plugins />
              <Techdocs />
              <Searches />
            </Masonry>
          </Content>
        </DateRangeProvider>
      )}
    </Page>
  );
};

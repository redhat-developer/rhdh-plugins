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
import { Box, Grid } from '@material-ui/core';
import { Header, Page, Content, LinkButton } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import { x2aAdminWritePermission } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useTranslation } from '../../hooks/useTranslation';
import { rulesRouteRef } from '../../routes';
import { ProjectList } from '../ProjectList';

export const Dashboard = () => {
  const { t } = useTranslation();
  const rulesPath = useRouteRef(rulesRouteRef);
  const { allowed: isAdmin, loading: permLoading } = usePermission({
    permission: x2aAdminWritePermission,
  });

  return (
    <Page themeId="tool">
      <Header title={t('page.title')} subtitle={t('page.subtitle')}>
        {!permLoading && isAdmin && (
          <Box display="flex" alignItems="center">
            <LinkButton variant="outlined" color="default" to={rulesPath()}>
              {t('rulesPage.manageRules')}
            </LinkButton>
          </Box>
        )}
      </Header>

      <Content>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <ProjectList />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};

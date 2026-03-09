/**
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

import { Breadcrumbs, Link } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core';
import { useTranslation } from '../../hooks/useTranslation';
import { projectRouteRef } from '../../routes';
import { useRouteRef } from '@backstage/core-plugin-api';

const useStyles = makeStyles(() => ({
  breadcrumbs: {
    '& p': {
      textDecoration: 'none',
    },
  },
}));

export const ModulePageBreadcrumb = ({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const projectRoute = useRouteRef(projectRouteRef);
  const projectUrl = projectRoute?.({ projectId }) ?? '/x2a';

  return (
    <Breadcrumbs
      aria-label="breadcrumb"
      separator=">"
      className={classes.breadcrumbs}
    >
      <Link to="/x2a">{t('page.title')}</Link>
      <Link to={projectUrl}>{projectName}</Link>
      {t('modulePage.title')}
    </Breadcrumbs>
  );
};

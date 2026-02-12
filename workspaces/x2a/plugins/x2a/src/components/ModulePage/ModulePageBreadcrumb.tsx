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
import { makeStyles, Typography } from '@material-ui/core';
import { useTranslation } from '../../hooks/useTranslation';

const useStyles = makeStyles(() => ({
  breadcrumbs: {
    '& p': {
      textDecoration: 'none',
    },
  },
}));

export const ModulePageBreadcrumb = () => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <Breadcrumbs
      aria-label="breadcrumb"
      separator=">"
      className={classes.breadcrumbs}
    >
      <Link to="/">{t('page.title')}</Link>
      <Typography>{t('modulePage.title')}</Typography>
      <Typography>Breadcrumbs</Typography>
    </Breadcrumbs>
  );
};

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

import { Content, Header, Page } from '@backstage/core-components';

import { createStyles, makeStyles } from '@material-ui/core/styles';

import { useTranslation } from '../hooks/useTranslation';
import { LightspeedChatContainer } from './LightspeedChatContainer';

const useStyles = makeStyles(() =>
  createStyles({
    container: {
      padding: '0px',
    },
  }),
);

/**
 * Lightspeed Page - Routable fullscreen/embedded mode
 * @public
 */
export const LightspeedPage = () => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <Page themeId="tool">
      <Header
        title={t('page.title')}
        style={{ display: 'none' }}
        pageTitleOverride={t('page.title')}
      />
      <Content className={classes.container}>
        <LightspeedChatContainer />
      </Content>
    </Page>
  );
};

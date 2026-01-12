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
import { Page, Header, Content } from '@backstage/core-components';

import { useTranslation } from '../hooks/useTranslation';

import { LanguageToggleCard } from './LanguageToggleCard';
import { AppLanguageCard } from './AppLanguageCard';
import { I18NextCard } from './I18NextCard';
import { I18NextDemoCard } from './I18NextDemoCard';

/**
 * @public
 */
export const TranslationsTestPage = () => {
  const { t } = useTranslation();

  return (
    <Page themeId="tool">
      <Header title={t('page.title')} subtitle={t('page.subtitle')} />
      <Content>
        <LanguageToggleCard />
        <br />
        <br />
        <I18NextDemoCard />
        <br />
        <br />
        <AppLanguageCard />
        <br />
        <br />
        <I18NextCard />
      </Content>
    </Page>
  );
};

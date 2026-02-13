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
import { useAsync } from 'react-use';
import { Content, Page } from '@backstage/core-components';
import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useGreeting from '../../hooks/useGreeting';
import { useTranslation } from '../../hooks/useTranslation';
import LearnSection from '../LearnSection';
import ModelSection from '../ModelSection';
import SectionWrapper from '../SectionWrapper';
import TemplateSection from '../TemplateSection';

export const AiExperienceHomePage = () => {
  const greeting = useGreeting();
  const identityApi = useApi(identityApiRef);
  const { t } = useTranslation();

  const { value: profile } = useAsync(() => identityApi.getProfileInfo());

  return (
    <QueryClientProvider client={new QueryClient()}>
      <Page themeId="home">
        <Content>
          <Box>
            <SectionWrapper
              title={`${greeting} ${
                profile?.displayName ?? t('common.guest')
              }!`}
            >
              <Box sx={{ padding: '20px 10px 30px 40px' }}>
                <LearnSection />
              </Box>
            </SectionWrapper>
          </Box>
          <Box sx={{ pt: 3 }}>
            <SectionWrapper title={t('sections.exploreAiModels')}>
              <Box sx={{ padding: '20px 10px 10px 0' }}>
                <ModelSection />
              </Box>
            </SectionWrapper>
          </Box>
          <Box sx={{ pt: 3 }}>
            <SectionWrapper title={t('sections.exploreAiTemplates')}>
              <Box sx={{ padding: '20px 10px 10px 0' }}>
                <TemplateSection />
              </Box>
            </SectionWrapper>
          </Box>
        </Content>
      </Page>
    </QueryClientProvider>
  );
};

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
import Box from '@mui/material/Box';

import SectionWrapper from '../SectionWrapper';
import LearnSection from '../LearnSection';
import ModelSection from '../ModelSection';
import TemplateSection from '../TemplateSection';
import useGreeting from '../../hooks/useGreeting';

export const AiExperienceHomePage = () => {
  const greeting = useGreeting();

  return (
    <Page themeId="home">
      <Content>
        <Box>
          <SectionWrapper title={`${greeting} Alex!`}>
            <Box sx={{ padding: '20px 10px 30px 40px' }}>
              <LearnSection />
            </Box>
          </SectionWrapper>
        </Box>
        <Box sx={{ pt: 3 }}>
          <SectionWrapper title="Explore AI models">
            <Box sx={{ padding: '20px 10px 10px 0' }}>
              <ModelSection />
            </Box>
          </SectionWrapper>
        </Box>
        <Box sx={{ pt: 3 }}>
          <SectionWrapper title="Explore AI templates">
            <Box sx={{ padding: '20px 10px 10px 0' }}>
              <TemplateSection />
            </Box>
          </SectionWrapper>
        </Box>
      </Content>
    </Page>
  );
};

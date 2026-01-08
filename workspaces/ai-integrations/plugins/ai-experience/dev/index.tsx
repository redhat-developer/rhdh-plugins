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
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import { createDevApp } from '@backstage/dev-utils';
import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import {
  aiExperiencePlugin,
  AiExperiencePage,
  AiNewsPage,
} from '../src/plugin';
import { aiExperienceTranslationsResource } from '../src/translations';

createDevApp()
  .registerPlugin(aiExperiencePlugin)
  .addThemes(getAllThemes())
  .addTranslationResource(aiExperienceTranslationsResource)
  .setAvailableLanguages(['en', 'de', 'fr', 'es'])
  .setDefaultLanguage('en')
  .addPage({
    element: <AiExperiencePage />,
    title: 'Root Page',
    path: '/ai-experience',
  })
  .addPage({
    element: <AiNewsPage />,
    title: 'AI News',
    icon: NewspaperOutlinedIcon,
    path: '/news',
  })
  .render();

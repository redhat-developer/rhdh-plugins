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

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { useOnboardingSection } from '../OnboardingSection/OnboardingSection';
import { EntitySectionContent } from '../EntitySection/EntitySection';
import { TemplateSectionContent } from '../TemplateSection/TemplateSection';
import { useTranslation } from '../../hooks/useTranslation';
import {
  sectionCardSx,
  sectionScrollSx,
  sectionTitleSx,
} from '../../styles/sectionCardSx';

/**
 * Legacy dynamic-plugin card with its own MUI Card shell (ReadOnlyGrid does not
 * wrap mount points in InfoCard).
 *
 * @public
 */
export const OnboardingSection = () => {
  const { greetingLine, body } = useOnboardingSection();

  return (
    <Card elevation={0} sx={sectionCardSx}>
      {greetingLine}
      <Box sx={sectionScrollSx}>{body}</Box>
    </Card>
  );
};

/** @public */
export const EntitySection = () => {
  const { t } = useTranslation();

  return (
    <Card elevation={0} sx={sectionCardSx}>
      <Typography variant="h3" sx={sectionTitleSx}>
        {t('entities.title')}
      </Typography>
      <Box sx={sectionScrollSx}>
        <EntitySectionContent />
      </Box>
    </Card>
  );
};

/** @public */
export const TemplateSection = () => {
  const { t } = useTranslation();

  return (
    <Card elevation={0} sx={sectionCardSx}>
      <Typography variant="h3" sx={sectionTitleSx}>
        {t('templates.title')}
      </Typography>
      <Box sx={sectionScrollSx}>
        <TemplateSectionContent />
      </Box>
    </Card>
  );
};

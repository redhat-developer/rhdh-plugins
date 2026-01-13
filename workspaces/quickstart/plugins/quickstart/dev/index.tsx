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

import { createDevApp } from '@backstage/dev-utils';
import { quickstartPlugin, QuickstartDrawerProvider } from '../src/plugin';
import { quickstartTranslations } from '../src/translations';
import { useQuickstartDrawerContext } from '../src/hooks/useQuickstartDrawerContext';
import { useTranslation } from '../src/hooks/useTranslation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';

const QuickstartTestPageContent = () => {
  const { openDrawer, closeDrawer, isDrawerOpen } =
    useQuickstartDrawerContext();
  const { t } = useTranslation();

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h3" gutterBottom>
        {t('dev.pageTitle')}
      </Typography>

      <Typography variant="body1" paragraph>
        {t('dev.pageDescription')}
      </Typography>

      <Card sx={{ maxWidth: 600, marginBottom: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('dev.drawerControls')}
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            {t('dev.currentState' as any, {
              state: isDrawerOpen ? t('dev.stateOpen') : t('dev.stateClosed'),
            })}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={openDrawer}
              disabled={isDrawerOpen}
            >
              {t('button.openQuickstartGuide')}
            </Button>

            <Button
              variant="outlined"
              onClick={closeDrawer}
              disabled={!isDrawerOpen}
            >
              {t('button.closeDrawer')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('dev.instructions')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dev.step1')}
            <br />
            {t('dev.step2')}
            <br />
            {t('dev.step3')}
            <br />
            {t('dev.step4')}
            <br />
            {t('dev.step5')}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

const QuickstartTestPage = () => (
  <QuickstartDrawerProvider>
    <QuickstartTestPageContent />
  </QuickstartDrawerProvider>
);

createDevApp()
  .registerPlugin(quickstartPlugin)
  .addTranslationResource(quickstartTranslations)
  .setAvailableLanguages(['en', 'de', 'es', 'fr', 'it', 'ja'])
  .setDefaultLanguage('en')
  .addThemes(getAllThemes())
  .addPage({
    element: <QuickstartTestPage />,
    title: 'Quickstart Test',
    path: '/quickstart',
  })
  .render();

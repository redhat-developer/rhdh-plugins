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

import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Content, Page } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import { ScorecardHomepageCard } from '../ScorecardHomepageSection/ScorecardHomepageCard';
import { useTranslation } from '../../hooks/useTranslation';

import { EntitiesPageHeader } from './EntitiesPageHeader';
import { EntitiesTable } from './EntitiesTable/EntitiesTable';

export const ScorecardEntitiesPage = () => {
  const { metricId } = useParams<{ metricId?: string }>();

  const [metricTitle, setMetricTitle] = useState<string>('');

  const { t } = useTranslation();

  const titleKey = `metric.${metricId}.title`;
  const title = t(titleKey as any, {});
  const finalTitle = title === titleKey ? metricTitle : title;

  return (
    <Page themeId="home">
      <EntitiesPageHeader
        title={finalTitle || metricId || t('entitiesPage.unknownMetric')}
      />
      <Divider />
      <Content>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 3,
            py: 2,
          }}
        >
          <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0%' }, minWidth: 0 }}>
            <EntitiesTable
              metricId={metricId}
              setMetricTitle={setMetricTitle}
            />
          </Box>
          <Box
            sx={{
              flex: { xs: '1 1 100%', lg: '0 0 33%' },
              minWidth: 0,
              alignSelf: 'flex-start',
              height: { xs: 320, sm: 380 },
              '& > *': { height: '100%' },
              '& > div[class*="MuiCard-root"]': {
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              },
              '& div[class*="MuiCardContent-root"]': {
                flex: 1,
                minHeight: 0,
              },
            }}
          >
            <ScorecardHomepageCard
              metricId={metricId as string}
              showSubheader={false}
              showInfo={false}
            />
          </Box>
        </Box>
      </Content>
    </Page>
  );
};

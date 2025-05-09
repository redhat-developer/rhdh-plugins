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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { ItemCardGrid } from '@backstage/core-components';
import { SandboxActivitiesCard } from './SandboxActivitiesCard';
import { articleData } from './articleData';

const FeaturedArticles: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '36px 60px 48px 60px',
      }}
    >
      <Typography
        variant="h3"
        color="textPrimary"
        sx={{ fontWeight: 700, marginBottom: theme.spacing(4) }}
        gutterBottom
      >
        Featured
      </Typography>
      <ItemCardGrid>
        {articleData?.featured?.map(article => (
          <SandboxActivitiesCard key={article.title} article={article} />
        ))}
      </ItemCardGrid>
    </Box>
  );
};

const Articles: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '36px 60px 48px 60px',
        backgroundColor:
          theme.palette.mode === 'dark'
            ? '#000000'
            : theme.palette.background.default,
      }}
    >
      <ItemCardGrid>
        {articleData?.other?.map(article => (
          <SandboxActivitiesCard key={article.title} article={article} />
        ))}
      </ItemCardGrid>
    </Box>
  );
};

export const SandboxActivitiesGrid: React.FC = () => {
  return (
    <>
      <FeaturedArticles />
      <Articles />
    </>
  );
};

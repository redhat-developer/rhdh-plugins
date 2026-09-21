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

import { Content, InfoCard } from '@backstage/core-components';
import { useTranslationRef } from '@backstage/frontend-plugin-api';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

import { translationRef } from '../../translations/ref';
import { useLearningPathData } from '../hooks/useLearningPathData';
import { LearningPathLink } from '../types';
import { ErrorReport } from './ErrorReport';

const infoCardSx: SxProps<Theme> = {
  height: '100%',
  '& .MuiPaper-root': {
    height: '100%',
    transition: 'all 0.25s linear',
    textAlign: 'left',
    '&:hover': {
      boxShadow: '0px 0px 16px 0px rgba(0, 0, 0, 0.8)',
    },
    '& svg': {
      fontSize: '80px',
    },
  },
};

const learningPathLengthInfo = (path: LearningPathLink) => {
  const durationParts: string[] = [];

  if (path.hours) {
    const hoursText = path.hours === 1 ? 'hour' : 'hours';
    durationParts.push(`${path.hours} ${hoursText}`);
  }
  if (path.minutes) {
    const minutesText = path.minutes === 1 ? 'minute' : 'minutes';
    durationParts.push(`${path.minutes} ${minutesText}`);
  }

  const duration = durationParts.join(' ');
  const pathsText = path.paths === 1 ? 'learning path' : 'learning paths';

  return duration
    ? `${duration} | ${path.paths} ${pathsText}`
    : `${path.paths} ${pathsText}`;
};

const LearningPathCards = () => {
  const { t } = useTranslationRef(translationRef);

  const { data, error, isLoading } = useLearningPathData();

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <ErrorReport
        title={t('learningPaths.error.title')}
        errorText={error.toString()}
      />
    );
  }

  if (!data) {
    return (
      <ErrorReport
        title={t('learningPaths.error.title')}
        errorText={t('learningPaths.error.unknownError')}
      />
    );
  }

  return (
    <Grid container justifyContent="center" alignContent="center" spacing={2}>
      {data.map(p => (
        <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={p.label}>
          <Link href={p.url} target="_blank" underline="none">
            <Box sx={infoCardSx}>
              <InfoCard title={p.label} subheader={learningPathLengthInfo(p)}>
                <Typography paragraph>{p.description}</Typography>
              </InfoCard>
            </Box>
          </Link>
        </Grid>
      ))}
    </Grid>
  );
};

/** @internal */
export const LearningPathsPage = () => {
  return (
    <Content>
      <Grid container justifyContent="center">
        <Grid item>
          <LearningPathCards />
        </Grid>
      </Grid>
    </Content>
  );
};

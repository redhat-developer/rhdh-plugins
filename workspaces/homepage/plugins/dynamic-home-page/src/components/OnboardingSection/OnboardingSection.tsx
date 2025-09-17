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
import { useState, useEffect } from 'react';

import { useUserProfile } from '@backstage/plugin-user-settings';
import { useApi } from '@backstage/core-plugin-api';
import { UserEntity } from '@backstage/catalog-model';
import { catalogApiRef } from '@backstage/plugin-catalog-react';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import OnboardingCard from './OnboardingCard';
import HomePageIllustrationDark from '../../images/homepage-illustration-dark.svg';
import HomePageIllustrationLight from '../../images/homepage-illustration-light.svg';
import { getLearningItems } from '../../utils/constants';
import useGreeting from '../../hooks/useGreeting';
import { LearningSectionItem } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

export const OnboardingSection = () => {
  const [user, setUser] = useState<string | null>();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const greeting = useGreeting();
  const { t } = useTranslation();
  const {
    displayName,
    backstageIdentity,
    loading: profileLoading,
  } = useUserProfile();
  const catalogApi = useApi(catalogApiRef);

  useEffect(() => {
    const fetchUserEntity = async () => {
      if (!backstageIdentity?.userEntityRef) {
        return;
      }
      try {
        const userEntity = (await catalogApi.getEntityByRef(
          backstageIdentity.userEntityRef,
        )) as unknown as UserEntity;
        setUser(
          userEntity?.spec?.profile?.displayName ?? userEntity?.metadata?.title,
        );
      } catch (_err) {
        setUser(null);
      }
    };

    fetchUserEntity();
  }, [backstageIdentity, catalogApi]);

  const profileDisplayName = () => {
    const name = user ?? displayName;
    const regex = /^[^:/]+:[^/]+\/[^/]+$/;
    if (regex.test(name)) {
      return name
        .charAt(name.indexOf('/') + 1)
        .toLocaleUpperCase('en-US')
        .concat(name.substring(name.indexOf('/') + 2));
    }
    return name;
  };

  const content = (
    <Box>
      <Grid container margin="auto">
        <Grid
          item
          xs={12}
          md={6}
          lg={3}
          display="flex"
          justifyContent="left"
          alignItems="center"
        >
          <Box
            component="img"
            src={
              isDarkMode ? HomePageIllustrationDark : HomePageIllustrationLight
            }
            alt=""
            sx={{
              width: 'clamp(200px, 20vw, 264px)',
            }}
          />
        </Grid>
        {getLearningItems(t).map((item: LearningSectionItem) => (
          <Grid
            item
            xs={12}
            md={6}
            lg={3}
            key={item.title}
            display="flex"
            justifyContent="left"
            alignItems="center"
          >
            <OnboardingCard
              title={item.title}
              description={item.description}
              buttonText={item.buttonText}
              buttonLink={item.buttonLink}
              target={item.target}
              ariaLabel={item.ariaLabel}
              endIcon={<item.endIcon />}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Card
      elevation={0}
      sx={{
        padding: '24px',
        border: muiTheme => `1px solid ${muiTheme.palette.grey[300]}`,
        overflow: 'auto',
      }}
    >
      {!profileLoading && (
        <Typography
          variant="h3"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: '500',
            fontSize: '1.5rem',
          }}
        >
          {`${greeting}, ${profileDisplayName() || t('onboarding.guest')}!`}
        </Typography>
      )}
      {content}
    </Card>
  );
};

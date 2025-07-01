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

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { Responsive, WidthProvider } from 'react-grid-layout';

import OnboardingCard from './OnboardingCard';
import HomePageIllustrationDark from '../../images/homepage-illustration-dark.svg';
import HomePageIllustrationLight from '../../images/homepage-illustration-light.svg';
import {
  CARD_BREAKPOINTS,
  CARD_COLUMNS,
  LEARNING_SECTION_ITEMS,
} from '../../utils/constants';
import useGreeting from '../../hooks/useGreeting';
import { generateOnboardingLayouts } from '../../utils/utils';

// eslint-disable-next-line new-cap
const ResponsiveGridLayout = WidthProvider(Responsive);

export const OnboardingSection = () => {
  const [user, setUser] = useState<string | null>();
  const [imgMarginAlign, setImgMarginAlign] = useState<string>('auto');
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const greeting = useGreeting();
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

  const onboardingItems = ['image', 'card1', 'card2', 'card3'];
  const onboardingLayouts = generateOnboardingLayouts(onboardingItems);

  const handleBreakpointChange = (newBreakpoint: string) => {
    if (newBreakpoint === 'xxs' || newBreakpoint === 'xs') {
      setImgMarginAlign('unset');
    } else {
      setImgMarginAlign('auto');
    }
  };

  const content = (
    <ResponsiveGridLayout
      className="layout"
      layouts={onboardingLayouts}
      breakpoints={CARD_BREAKPOINTS}
      cols={CARD_COLUMNS}
      onBreakpointChange={handleBreakpointChange}
      containerPadding={[16, 16]}
      margin={[0, 0]}
      isResizable={false}
      isDraggable={false}
    >
      <div key="image">
        <Box
          sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center' }}
        >
          <Box
            component="img"
            src={
              isDarkMode ? HomePageIllustrationDark : HomePageIllustrationLight
            }
            alt=""
            sx={{ width: 'clamp(200px, 100%, 264px)', margin: imgMarginAlign }}
          />
        </Box>
      </div>

      {LEARNING_SECTION_ITEMS.map((item, index) => (
        <div key={`card${index + 1}`}>
          <Box sx={{ padding: 1 }}>
            <OnboardingCard
              title={item.title}
              description={item.description}
              buttonText={item.buttonText}
              buttonLink={item.buttonLink}
              target={item.target}
              ariaLabel={item.ariaLabel}
            />
          </Box>
        </div>
      ))}
    </ResponsiveGridLayout>
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
          {`${greeting} ${profileDisplayName() || 'Guest'}!`}
        </Typography>
      )}
      {content}
    </Card>
  );
};

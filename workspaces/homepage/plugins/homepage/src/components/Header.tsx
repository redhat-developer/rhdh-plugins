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

import { useMemo } from 'react';

import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import { Header as BackstageHeader } from '@backstage/core-components';
import { ClockConfig, HeaderWorldClock } from '@backstage/plugin-home';

import useAsync from 'react-use/esm/useAsync';

import { LocalClock, LocalClockProps } from './LocalClock';
import { useTranslation } from '../hooks/useTranslation';

export interface HeaderProps {
  title?: string;
  personalizedTitle?: string;
  pageTitle?: string;
  subtitle?: string;
  localClock?: LocalClockProps;
  worldClocks?: ClockConfig[];
}

// I kept this because I hope that we will add this soon or at least in Dynamic Home Page plugin 1.2 ~ RHDH 1.6.
// const getTimeBasedTitle = (): string => {
//   const currentHour = new Date(Date.now()).getHours();
//   if (currentHour < 12) {
//     return 'Good morning {{firstName}}';
//   } else if (currentHour < 17) {
//     return 'Good afternoon {{firstName}}';
//   }
//   return 'Good evening {{firstName}}';
// };

/**
 * Handles user-provided title customization with variable interpolation.
 *
 * When users provide custom titles in their configuration, they take responsibility
 * for internationalization at the configuration level. This function simply handles
 * the variable interpolation for their custom strings.
 *
 * Supports variables:
 * - {{firstName}} - First part of displayName (split by space)
 * - {{displayName}} - Full displayName from user profile
 *
 * @param title - User-provided title string with optional {{variables}}
 * @param displayName - User's displayName from profile, if available
 */
const interpolateUserTitle = (
  title: string,
  displayName: string | undefined,
) => {
  if (!displayName) {
    // Remove variable placeholders when no displayName is available
    return title.replace(/\{\{(firstName|displayName)\}\}/g, '');
  }

  const firstName = displayName.split(' ')[0];
  return title
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{displayName\}\}/g, displayName);
};

export const Header = (props: HeaderProps) => {
  const identityApi = useApi(identityApiRef);
  const { value: profile } = useAsync(() => identityApi.getProfileInfo());
  const { t } = useTranslation();

  const title = useMemo<string>(() => {
    const firstName = profile?.displayName?.split(' ')[0];

    // Priority 1: User-provided personalized title (user handles i18n)
    if (profile?.displayName && props.personalizedTitle) {
      return interpolateUserTitle(props.personalizedTitle, profile.displayName);
    }

    // Priority 2: User-provided general title (user handles i18n)
    if (props.title) {
      return interpolateUserTitle(props.title, profile?.displayName);
    }

    // Default: Use plugin's translation system
    if (profile?.displayName && firstName) {
      return t('header.welcomePersonalized' as any, { name: firstName });
    }

    return t('header.welcome');
  }, [profile?.displayName, props.personalizedTitle, props.title, t]);

  const subtitle = useMemo<string | undefined>(() => {
    // User-provided subtitle (user handles i18n)
    if (props.subtitle) {
      return interpolateUserTitle(props.subtitle, profile?.displayName);
    }

    return undefined;
  }, [props.subtitle, profile?.displayName]);

  return (
    <BackstageHeader
      title={title}
      subtitle={subtitle}
      pageTitleOverride={props.pageTitle}
    >
      {props.localClock?.format && props.localClock?.format !== 'none' ? (
        <LocalClock
          label={
            props.localClock?.label ??
            (props.worldClocks && props.worldClocks.length > 0
              ? t('header.local')
              : undefined)
          }
          format={
            props.localClock?.format ??
            (props.worldClocks && props.worldClocks.length > 0
              ? 'time'
              : undefined)
          }
          lang={props.localClock?.lang}
        />
      ) : null}

      {props.worldClocks && props.worldClocks.length > 0 ? (
        <HeaderWorldClock clockConfigs={props.worldClocks} />
      ) : null}
    </BackstageHeader>
  );
};

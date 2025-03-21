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

import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import { Header as BackstageHeader } from '@backstage/core-components';
import { ClockConfig, HeaderWorldClock } from '@backstage/plugin-home';

import useAsync from 'react-use/esm/useAsync';

import { LocalClock, LocalClockProps } from './LocalClock';

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

export const getPersonalizedTitle = (
  title: string,
  displayName: string | undefined,
) => {
  const firstName = displayName?.split(' ')[0];
  const replacedTitle = title
    .replace('{{firstName}}', firstName ?? '')
    .replace('{{displayName}}', displayName ?? '');
  return replacedTitle;
};

export const Header = (props: HeaderProps) => {
  const identityApi = useApi(identityApiRef);
  const { value: profile } = useAsync(() => identityApi.getProfileInfo());

  const title = React.useMemo<string>(() => {
    if (profile?.displayName && props.personalizedTitle) {
      return getPersonalizedTitle(props.personalizedTitle, profile.displayName);
    } else if (props.title) {
      return getPersonalizedTitle(props.title, profile?.displayName);
    }
    // return getPersonalizedTitle(getTimeBasedTitle(), profile?.displayName);
    return getPersonalizedTitle('Welcome back!', profile?.displayName);
  }, [profile?.displayName, props.personalizedTitle, props.title]);

  const subtitle = React.useMemo<string | undefined>(() => {
    return props.subtitle
      ? getPersonalizedTitle(props.subtitle, profile?.displayName)
      : undefined;
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
              ? 'Local'
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

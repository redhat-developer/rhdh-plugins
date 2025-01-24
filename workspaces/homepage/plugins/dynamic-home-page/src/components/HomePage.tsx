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

import React, { useMemo } from 'react';

import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import { Content, EmptyState, Header, Page } from '@backstage/core-components';
import { ClockConfig, HeaderWorldClock } from '@backstage/plugin-home';

import useAsync from 'react-use/esm/useAsync';

import { HomePageCardMountPoint } from '../types';
import { ReadOnlyGrid } from './ReadOnlyGrid';
import { LocalClock, LocalClockProps } from './LocalClock';

export interface HomePageProps {
  title?: string;
  personalizedTitle?: string;
  pageTitle?: string;
  subtitle?: string;
  localClock?: LocalClockProps;
  worldClocks?: ClockConfig[];
  cards?: HomePageCardMountPoint[];
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

const getPersonalizedTitle = (
  title: string,
  displayName: string | undefined,
) => {
  const firstName = displayName?.split(' ')[0];
  const replacedTitle = title
    .replace('{{firstName}}', firstName ?? '')
    .replace('{{displayName}}', displayName ?? '');
  return replacedTitle;
};

export const HomePage = (props: HomePageProps) => {
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

  const filteredAndSortedHomePageCards = useMemo(() => {
    if (!props.cards) {
      return [];
    }

    const filteredAndSorted = props.cards.filter(
      card =>
        card.enabled !== false &&
        (!card.config?.priority || card.config.priority >= 0),
    );

    filteredAndSorted.sort(
      (a, b) => (b.config?.priority ?? 0) - (a.config?.priority ?? 0),
    );

    return filteredAndSorted;
  }, [props.cards]);

  return (
    <Page themeId="home">
      <Header
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
      </Header>
      <Content>
        {filteredAndSortedHomePageCards.length === 0 ? (
          <EmptyState
            title="No home page cards (mount points) configured or found."
            missing="content"
          />
        ) : (
          <ReadOnlyGrid mountPoints={filteredAndSortedHomePageCards} />
        )}
      </Content>
    </Page>
  );
};

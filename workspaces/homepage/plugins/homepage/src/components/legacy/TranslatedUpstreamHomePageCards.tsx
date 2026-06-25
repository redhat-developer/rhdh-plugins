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

import {
  HomePageRandomJoke,
  HomePageRecentlyVisited,
  HomePageStarredEntities,
  HomePageTopVisited,
  StarredEntitiesProps,
  VisitedByTypeProps,
} from '@backstage/plugin-home';

import {
  TranslatableCardTitleProps,
  useHomePageCardTitle,
} from '../../utils/useHomePageCardTitle';

/** @public */
export type CatalogStarredEntitiesCardProps = StarredEntitiesProps &
  TranslatableCardTitleProps;

/** @public */
export const CatalogStarredEntitiesCard = (
  props: CatalogStarredEntitiesCardProps,
) => {
  const { titleKey: _titleKey, title: _title, ...cardProps } = props;
  const title = useHomePageCardTitle('starredEntities.title', props);
  return <HomePageStarredEntities {...cardProps} title={title} />;
};

/** @public */
export type RecentlyVisitedCardProps = VisitedByTypeProps &
  TranslatableCardTitleProps;

/** @public */
export const RecentlyVisitedCard = (props: RecentlyVisitedCardProps) => {
  const { titleKey: _titleKey, title: _title, ...cardProps } = props;
  const title = useHomePageCardTitle('recentlyVisited.title', props);
  return <HomePageRecentlyVisited {...cardProps} title={title} />;
};

/** @public */
export type TopVisitedCardProps = VisitedByTypeProps &
  TranslatableCardTitleProps;

/** @public */
export const TopVisitedCard = (props: TopVisitedCardProps) => {
  const { titleKey: _titleKey, title: _title, ...cardProps } = props;
  const title = useHomePageCardTitle('topVisited.title', props);
  return <HomePageTopVisited {...cardProps} title={title} />;
};

/** @public */
export type JokeCardProps = TranslatableCardTitleProps & {
  defaultCategory?: 'any' | 'programming';
};

/** @public */
export const JokeCard = (props: JokeCardProps) => {
  const { titleKey: _titleKey, title: _title, ...cardProps } = props;
  const title = useHomePageCardTitle('randomJoke.title', props);
  return <HomePageRandomJoke {...cardProps} title={title} />;
};

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
  createPermissionRule,
  type PermissionRule,
} from '@backstage/plugin-permission-node';
import { z } from 'zod/v3';
import {
  VisibleCard,
  RESOURCE_TYPE_HOMEPAGE_DEFAULT_CARD,
} from '@red-hat-developer-hub/backstage-plugin-homepage-common';
import { homepageDefaultCardPermissionResourceRef } from './resource';

export type HomepageDefaultCardFilter = {
  key: string;
  values: Array<string> | undefined;
};

type HasCardIdParams = { cardIds?: string[] | undefined };

const hasCardId = createPermissionRule({
  name: 'HAS_CARD_ID',
  description:
    'Should allow users to access homepage cards with specified card IDs',
  resourceRef: homepageDefaultCardPermissionResourceRef,

  paramsSchema: z.object({
    cardIds: z
      .string()
      .array()
      .optional()
      .describe('List of card IDs to match on'),
  }),
  apply: (card: VisibleCard, { cardIds }: HasCardIdParams) => {
    return cardIds && cardIds.length > 0 ? cardIds.includes(card.id) : true;
  },
  toQuery: ({ cardIds }: HasCardIdParams) => ({
    key: 'cardId',
    values: cardIds,
  }),
} as any) as unknown as PermissionRule<
  VisibleCard,
  HomepageDefaultCardFilter,
  typeof RESOURCE_TYPE_HOMEPAGE_DEFAULT_CARD,
  HasCardIdParams
>;

export const rules = { hasCardId };

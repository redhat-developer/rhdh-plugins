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

import { VisitListener as VisitListenerComponent } from '@backstage/plugin-home';
import { useDynamicHomePageCards } from '../hooks/useDynamicHomePageCards';

export const VisitListener = () => {
  const cards = useDynamicHomePageCards();

  const shouldLoadVisitListener = React.useMemo<boolean>(() => {
    if (!cards) {
      return false;
    }

    const requiresVisitListener = [
      'Extension(RecentlyVisitedCard)',
      'Extension(TopVisitedCard)',
    ];

    return cards.some(card =>
      requiresVisitListener.includes(card.Component.displayName!),
    );
  }, [cards]);

  return shouldLoadVisitListener ? <VisitListenerComponent /> : null;
};

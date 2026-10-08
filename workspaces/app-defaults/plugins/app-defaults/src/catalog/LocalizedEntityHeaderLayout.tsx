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

import { type HeaderNavTabItem } from '@backstage/ui';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { EntityHeaderLayoutProps } from '@backstage/plugin-catalog-react/alpha';

import { appReactTranslationRef } from '@red-hat-developer-hub/backstage-plugin-app-react';
import { EntityHeaderBui } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';

/**
 * Entity header layout that renders the Backstage `EntityHeaderBui` with
 * localized tab titles labels for some well-known catalog tabs.
 * Additional titles contributed by plugins we do not know about fall
 * through unchanged.
 */
export function LocalizedEntityHeaderLayout(props: EntityHeaderLayoutProps) {
  // The tab titles are translated under the `catalog.entityTabs.<title>` keys
  // and the group titles under `catalog.entityTabGroups.<title>`, where the key
  // is the English title itself (see the app-react translations). Since a
  // rendered tab can be either an individual tab or a (collapsed) group, each
  // title is looked up in both namespaces. Looking the title up dynamically
  // means a new title only needs a translation entry — no change to this
  // component. Titles without a matching translation fall back to the original
  // English label.
  //
  // i18next uses `.` as its key separator, so any dot in the label is replaced
  // with `_` to keep the whole title as a single key (e.g. a title like
  // `Mend.io` is translated under `catalog.entityTabs.Mend_io`).
  const { t } = useTranslationRef(appReactTranslationRef);
  const translateTitle = t as unknown as (
    key: string,
    options: { defaultValue: string },
  ) => string;
  const translate = (label: string) => {
    const key = label.replaceAll('.', '_');
    return translateTitle(`catalog.entityTabs.${key}`, {
      defaultValue: translateTitle(`catalog.entityTabGroups.${key}`, {
        defaultValue: label,
      }),
    });
  };

  const translatedTabs: HeaderNavTabItem[] = props.tabs.map(tab =>
    'items' in tab
      ? {
          ...tab,
          label: translate(tab.label),
          items: tab.items.map(item => ({
            ...item,
            label: translate(item.label),
          })),
        }
      : { ...tab, label: translate(tab.label) },
  );

  return <EntityHeaderBui {...props} tabs={translatedTabs} />;
}

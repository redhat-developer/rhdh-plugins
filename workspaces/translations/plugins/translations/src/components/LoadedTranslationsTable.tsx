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
import { Table } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  appLanguageApiRef,
  translationApiRef,
} from '@backstage/core-plugin-api/alpha';

import type { i18n as I18n, Resource } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface Row {
  ref: string;
  key: string;
  [lang: string]: string | undefined;
}

// From https://github.com/backstage/backstage/blob/89f191b72c154e3f0bde70548a7bccbb23af8de0/plugins/user-settings/src/components/General/UserSettingsLanguageToggle.tsx#L68
const getLanguageDisplayName = (language: string) => {
  try {
    const names = new Intl.DisplayNames([language], {
      type: 'language',
    });
    const languageDisplayName = names.of(language);
    if (languageDisplayName) {
      return `${languageDisplayName} (${language})`;
    }
    return language;
  } catch (err) {
    return language;
  }
};

const getTranslation = (
  resources: Resource,
  lang: string,
  ref: string,
  key: string,
) => {
  const resourceLang = resources[lang];
  const resourceKey = resourceLang?.[ref];
  const translation =
    typeof resourceKey === 'object' ? resourceKey?.[key] : undefined;
  return translation;
};

export const LoadedTranslationsTable = () => {
  const { t } = useTranslation();
  const appLanguageApi = useApi(appLanguageApiRef);
  const translationApi = useApi(translationApiRef);
  const i18n: I18n = (translationApi as any).getI18nInstance();

  const resources = i18n.store.data;

  // FIXME: the available languages are not yet loaded...
  const showLanguages = useMemo(
    () => [
      'en',
      ...appLanguageApi
        .getAvailableLanguages()
        .languages.filter(lang => lang !== 'en'),
    ],
    [appLanguageApi],
  );

  const columns = useMemo(
    () => [
      { title: t('table.headers.refId'), field: 'ref' },
      { title: t('table.headers.key'), field: 'key' },
      ...showLanguages.map(lang => ({
        title: getLanguageDisplayName(lang),
        field: lang,
      })),
    ],
    [showLanguages, t],
  );

  const data = useMemo(() => {
    const rows: Row[] = [];

    // Iterate first over primary language english
    if (resources.en) {
      for (const ref of Object.keys(resources.en)) {
        for (const key of Object.keys(resources.en[ref])) {
          rows.push(
            showLanguages.reduce(
              (row, lang) => {
                row[lang] = getTranslation(resources, lang, ref, key);
                return row;
              },
              {
                ref,
                key,
              } as Row,
            ),
          );
        }
      }
    }

    // Check if other languages have additional keys
    for (const otherLang of Object.keys(resources)) {
      if (otherLang === 'en') {
        continue;
      }
      for (const ref of Object.keys(resources[otherLang])) {
        for (const key of Object.keys(resources[otherLang][ref])) {
          // if the key exists in english, then it was already added
          const resourceLang = resources.en;
          const resourceKey = resourceLang?.[ref];
          if (typeof resourceKey === 'object' && resourceKey?.[key]) {
            continue;
          }
          // Check if we already have a row for this ref/key combination
          // from another language. If yes, then we can skip this as well.
          const existingRow = rows.find(r => r.ref === ref && r.key === key);
          if (existingRow) {
            showLanguages.forEach(lang => {
              existingRow[lang] = getTranslation(resources, lang, ref, key);
            });
            continue;
          }
          // Otherwise add a new row and include all languages
          rows.push(
            showLanguages.reduce(
              (row, lang) => {
                row[lang] = getTranslation(resources, lang, ref, key);
                return row;
              },
              {
                ref,
                key,
              } as Row,
            ),
          );
        }
      }
    }

    return rows;
  }, [resources, showLanguages]);

  return (
    <Table
      title={t('table.title' as any, { count: data.length.toString() })}
      columns={columns}
      data={data}
      options={{
        pageSize: 10,
        pageSizeOptions: [10, 25, 100],
      }}
    />
  );
};

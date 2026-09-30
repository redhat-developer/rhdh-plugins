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
import { useTranslationRef } from '@backstage/frontend-plugin-api';
import { appReactTranslationRef } from '@red-hat-developer-hub/backstage-plugin-app-react';

/**
 * Returns a function that localizes an English page or tab title by looking it
 * up dynamically under the given namespaces of the app-react translations
 * (e.g. `pages.<title>` or `pageTabs.<title>`). The namespaces are tried in
 * order; unknown titles — including those contributed by plugins we do not
 * know about — fall through unchanged. i18next uses `.` as its key separator,
 * so any dot in the title is replaced with `_`.
 */
export function useTranslateTitle(
  ...namespaces: ('pages' | 'pageTabs')[]
): (title: string) => string {
  const { t } = useTranslationRef(appReactTranslationRef);
  return useMemo(() => {
    const translate = t as unknown as (
      key: string,
      options: { defaultValue: string },
    ) => string;
    return (title: string) => {
      const key = title.replaceAll('.', '_');
      return namespaces.reduceRight(
        (defaultValue, namespace) =>
          translate(`${namespace}.${key}`, { defaultValue }),
        title,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, ...namespaces]);
}

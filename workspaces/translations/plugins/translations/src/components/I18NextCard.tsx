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
import { InfoCard } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';

import type { i18n as I18n } from 'i18next';

export const I18NextCard = () => {
  const translationApi = useApi(translationApiRef);
  const i18n: I18n = (translationApi as any).getI18nInstance();

  return (
    <InfoCard title="TranslationApi / i18Next">
      <strong>Current Language:</strong>
      <br />
      {i18n.language}
      <br />
      <br />

      <strong>Available languages:</strong>
      <br />
      {i18n.languages?.map(lang => (
        <div key={lang}>{lang}</div>
      ))}

      <strong>Available languages:</strong>
      <br />
      <pre>{JSON.stringify(i18n.store.data, null, 2)}</pre>
    </InfoCard>
  );
};

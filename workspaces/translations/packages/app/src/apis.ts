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
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';

import {
  appLanguageApiRef,
  createTranslationMessages,
  createTranslationResource,
  translationApiRef,
} from '@backstage/core-plugin-api/alpha';

import { I18nextTranslationApi } from '@red-hat-developer-hub/backstage-plugin-translations';
import { translationsPluginTranslations } from '@red-hat-developer-hub/backstage-plugin-translations/alpha';
import { userSettingsTranslationRef } from '@backstage/plugin-user-settings/alpha';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: translationApiRef,
    deps: { languageApi: appLanguageApiRef },
    factory: ({ languageApi }) =>
      I18nextTranslationApi.create({
        languageApi,
        resources: [
          translationsPluginTranslations,
          createTranslationResource({
            ref: userSettingsTranslationRef,
            translations: {
              de: async () => ({
                default: createTranslationMessages({
                  ref: userSettingsTranslationRef,
                  full: false,
                  messages: {
                    sidebarTitle: 'Einstellungen',
                    'settingsLayout.title': 'Sprache',
                    xxx: 'yyy de',
                  } as any,
                }),
              }),
              fr: async () => ({
                default: createTranslationMessages({
                  ref: userSettingsTranslationRef,
                  full: false,
                  messages: {
                    xxx: 'yyy es',
                  } as any,
                }),
              }),
            },
          }),
        ],
      }),
  }),
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
];

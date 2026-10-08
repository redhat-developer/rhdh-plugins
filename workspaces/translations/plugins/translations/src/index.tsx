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
  ApiBlueprint,
  appLanguageApiRef,
  configApiRef,
  createExtensionInput,
  createFrontendModule,
  createFrontendPlugin,
  fetchApiRef,
  PageBlueprint,
  translationApiRef,
} from '@backstage/frontend-plugin-api';
import { discoveryApiRef } from '@backstage/core-plugin-api';
import ExtensionIcon from '@mui/icons-material/Extension';
import {
  AppRootWrapperBlueprint,
  TranslationBlueprint,
} from '@backstage/plugin-app-react';

import {
  translationsPluginTranslationRef,
  translationsPluginTranslations,
} from './translations';
import { I18nextTranslationApi } from './apis/I18nextTranslationApi';
import {
  createJsonTranslationsLoader,
  JsonTranslations,
} from './apis/jsonTranslations';
import { attachPseudolocalizationIfEnabled } from './apis/pseudolocalization';
import { PseudoLocalizationProvider } from './components/PseudoLocalizationProvider';

const JSON_TRANSLATIONS_TIMEOUT_MS = 10_000;

const translationsPage = PageBlueprint.make({
  params: {
    path: '/translations',
    title: 'Translations',
    icon: <ExtensionIcon />,
    noHeader: true,
    loader: () =>
      import('./components/TranslationsPage').then(m => <m.TranslationsPage />),
  },
});

const i18nTranslation = TranslationBlueprint.make({
  name: 'translations-i18n',
  params: {
    resource: translationsPluginTranslations,
  },
});

const translationsApiExtension = ApiBlueprint.makeWithOverrides({
  name: 'translations',
  inputs: {
    translations: createExtensionInput(
      [TranslationBlueprint.dataRefs.translation],
      { replaces: [{ id: 'app', input: 'translations' }], internal: true },
    ),
  },
  factory: (originalFactory, { inputs }) => {
    return originalFactory(defineParams =>
      defineParams({
        api: translationApiRef,
        deps: {
          languageApi: appLanguageApiRef,
          configApi: configApiRef,
          discoveryApi: discoveryApiRef,
          fetchApi: fetchApiRef,
        },
        factory: ({ languageApi, configApi, discoveryApi, fetchApi }) => {
          const resources = inputs.translations.map(i =>
            i.get(TranslationBlueprint.dataRefs.translation),
          );
          const requestJsonTranslations =
            async (): Promise<JsonTranslations> => {
              const controller = new AbortController();
              let timeoutId: ReturnType<typeof setTimeout> | undefined;
              const timeout = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                  controller.abort();
                  reject(
                    new Error(
                      `Timed out after ${JSON_TRANSLATIONS_TIMEOUT_MS}ms`,
                    ),
                  );
                }, JSON_TRANSLATIONS_TIMEOUT_MS);
              });
              const request = discoveryApi
                .getBaseUrl('translations')
                .then((baseUrl: string) =>
                  fetchApi.fetch(baseUrl, { signal: controller.signal }),
                )
                .then((response: Response) => {
                  if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                  }
                  return response.json();
                });

              try {
                return await Promise.race([request, timeout]);
              } finally {
                if (timeoutId) {
                  clearTimeout(timeoutId);
                }
              }
            };
          const loadJsonTranslations = createJsonTranslationsLoader(
            requestJsonTranslations,
            (error: unknown) => {
              // Keep plugin resources usable when the backend is unavailable.
              // eslint-disable-next-line no-console
              console.warn(`Unable to load JSON translations: ${error}`);
            },
          );

          const api = I18nextTranslationApi.create({
            languageApi,
            resources,
            loadJsonTranslations,
          });
          attachPseudolocalizationIfEnabled(api, configApi);
          return api;
        },
      }),
    );
  },
});

const pseudoLocalizationWrapper = AppRootWrapperBlueprint.make({
  name: 'pseudo-localization',
  params: {
    component: PseudoLocalizationProvider,
  },
});

/**
 * The Translations frontend plugin for the new Backstage frontend system.
 *
 * @public
 */
export default createFrontendPlugin({
  pluginId: 'translations',
  extensions: [translationsPage, i18nTranslation],
});

/**
 * Module that replaces the built-in TranslationApi with one that
 * exposes `getI18nInstance()`, needed by the translations debug page
 * and pseudo-localization. Also attaches pseudo-localization when
 * enabled via app-config or URL param.
 *
 * @public
 */
export const translationsApiModule = createFrontendModule({
  pluginId: 'app',
  extensions: [translationsApiExtension],
});

/**
 * Pseudo-localization module for OFS / dynamic plugins.
 * In NFS, pseudo-localization is handled by `translationsApiModule` instead.
 *
 * @public
 */
export const translationsPseudoLocalizationModule = createFrontendModule({
  pluginId: 'app',
  extensions: [pseudoLocalizationWrapper],
});

export { translationsPluginTranslationRef, translationsPluginTranslations };

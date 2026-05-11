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

import type { ConfigApi } from '@backstage/core-plugin-api';
import type { i18n as I18n } from 'i18next';
import Pseudo from 'i18next-pseudo';

import type { I18nextTranslationApi } from './I18nextTranslationApi';

/** @public */
export interface PseudolocalizationOptions {
  wrapped?: boolean;
  languageToPseudo?: string;
}

function mergePostProcess(i18n: I18n): void {
  const cur = i18n.options.postProcess;
  let list: string[];
  if (!cur) {
    list = [];
  } else if (Array.isArray(cur)) {
    list = [...cur];
  } else {
    list = [cur as string];
  }
  if (!list.includes('pseudo')) {
    list.push('pseudo');
  }
  i18n.options.postProcess = list;
}

/**
 * Attaches the i18next-pseudo post-processor to a translation API's i18n
 * instance. Call once after {@link I18nextTranslationApi.create}.
 *
 * @public
 */
export function attachPseudolocalization(
  translationApi: I18nextTranslationApi,
  options?: PseudolocalizationOptions,
): void {
  const i18n = translationApi.getI18nInstance();
  const wrapped = options?.wrapped ?? true;
  const languageToPseudo =
    options?.languageToPseudo ?? i18n.resolvedLanguage ?? i18n.language ?? 'en';

  const pseudo = new Pseudo({
    enabled: true,
    wrapped,
    languageToPseudo,
  });

  i18n.use(pseudo);
  mergePostProcess(i18n);

  const syncLanguageToPseudo = () => {
    const next =
      options?.languageToPseudo ??
      i18n.resolvedLanguage ??
      i18n.language ??
      'en';
    pseudo.configurePseudo({ languageToPseudo: next });
  };

  syncLanguageToPseudo();
  i18n.on('languageChanged', syncLanguageToPseudo);
}

/**
 * Convenience wrapper that enables pseudo-localization when activated via
 * URL query parameter (`?pseudolocalization=true`) or app-config
 * (`i18n.pseudolocalization.enabled: true`).
 *
 * @public
 */
export function attachPseudolocalizationIfEnabled(
  translationApi: I18nextTranslationApi,
  configApi: ConfigApi,
  locationSearch?: string,
): void {
  const params = new URLSearchParams(locationSearch ?? window.location.search);
  const fromQuery = params.get('pseudolocalization') === 'true';
  const fromConfig =
    configApi.getOptionalBoolean('i18n.pseudolocalization.enabled') ?? false;

  if (!fromQuery && !fromConfig) {
    return;
  }

  const languageToPseudo =
    params.get('lng') ??
    configApi.getOptionalString('i18n.pseudolocalization.language') ??
    undefined;

  attachPseudolocalization(translationApi, { languageToPseudo });
}

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

import { ConfigReader } from '@backstage/config';
import { createInstance as createI18n } from 'i18next';

import {
  attachPseudolocalization,
  attachPseudolocalizationIfEnabled,
} from './pseudolocalization';
import type { I18nextTranslationApi } from './I18nextTranslationApi';

function createMockTranslationApi(): I18nextTranslationApi {
  const i18n = createI18n({
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: {
        test: { greeting: 'Hello World' },
      },
    },
    ns: ['test'],
    defaultNS: 'test',
    initImmediate: false,
  });
  i18n.init();

  return { getI18nInstance: () => i18n } as unknown as I18nextTranslationApi;
}

describe('attachPseudolocalization', () => {
  it('transforms strings with bracket wrapping', () => {
    const api = createMockTranslationApi();
    attachPseudolocalization(api);

    const i18n = api.getI18nInstance();
    const result = i18n.t('greeting');

    expect(result).not.toBe('Hello World');
    expect(result).toMatch(/^\[.*\]$/);
  });

  it('does not wrap when wrapped option is false', () => {
    const api = createMockTranslationApi();
    attachPseudolocalization(api, { wrapped: false });

    const i18n = api.getI18nInstance();
    const result = i18n.t('greeting');

    expect(result).not.toBe('Hello World');
    expect(result).not.toMatch(/^\[.*\]$/);
  });

  it('only transforms the specified language', () => {
    const i18n = createI18n({
      lng: 'de',
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      resources: {
        en: { test: { greeting: 'Hello World' } },
        de: { test: { greeting: 'Hallo Welt' } },
      },
      ns: ['test'],
      defaultNS: 'test',
      initImmediate: false,
    });
    i18n.init();

    const api = {
      getI18nInstance: () => i18n,
    } as unknown as I18nextTranslationApi;

    attachPseudolocalization(api, { languageToPseudo: 'en' });

    const result = i18n.t('greeting');
    expect(result).toBe('Hallo Welt');
  });
});

describe('attachPseudolocalizationIfEnabled', () => {
  it('does nothing when not enabled', () => {
    const api = createMockTranslationApi();
    const configApi = new ConfigReader({});

    attachPseudolocalizationIfEnabled(api, configApi, '');

    const i18n = api.getI18nInstance();
    expect(i18n.t('greeting')).toBe('Hello World');
  });

  it('activates via config', () => {
    const api = createMockTranslationApi();
    const configApi = new ConfigReader({
      i18n: { pseudolocalization: { enabled: true } },
    });

    attachPseudolocalizationIfEnabled(api, configApi, '');

    const i18n = api.getI18nInstance();
    const result = i18n.t('greeting');
    expect(result).not.toBe('Hello World');
    expect(result).toMatch(/^\[.*\]$/);
  });

  it('activates via URL query parameter', () => {
    const api = createMockTranslationApi();
    const configApi = new ConfigReader({});

    attachPseudolocalizationIfEnabled(
      api,
      configApi,
      '?pseudolocalization=true',
    );

    const i18n = api.getI18nInstance();
    const result = i18n.t('greeting');
    expect(result).not.toBe('Hello World');
    expect(result).toMatch(/^\[.*\]$/);
  });

  it('uses language from config', () => {
    const api = createMockTranslationApi();
    const configApi = new ConfigReader({
      i18n: { pseudolocalization: { enabled: true, language: 'en' } },
    });

    attachPseudolocalizationIfEnabled(api, configApi, '');

    const i18n = api.getI18nInstance();
    const result = i18n.t('greeting');
    expect(result).toMatch(/^\[.*\]$/);
  });

  it('uses lng from URL query parameter over config', () => {
    const i18n = createI18n({
      lng: 'en',
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      resources: {
        en: { test: { greeting: 'Hello World' } },
      },
      ns: ['test'],
      defaultNS: 'test',
      initImmediate: false,
    });
    i18n.init();

    const api = {
      getI18nInstance: () => i18n,
    } as unknown as I18nextTranslationApi;

    const configApi = new ConfigReader({
      i18n: { pseudolocalization: { language: 'en' } },
    });

    attachPseudolocalizationIfEnabled(
      api,
      configApi,
      '?pseudolocalization=true&lng=fr',
    );

    // Current language is 'en' but pseudo targets 'fr', so 'en' strings stay untransformed
    expect(i18n.t('greeting')).toBe('Hello World');
  });
});

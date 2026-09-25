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
  AppLanguageApi,
  createTranslationRef,
} from '@backstage/core-plugin-api/alpha';

import { I18nextTranslationApi } from './I18nextTranslationApi';

describe('I18nextTranslationApi JSON translations', () => {
  it('applies JSON messages to synchronous translation snapshots', async () => {
    const languageApi = {
      getAvailableLanguages: () => ({
        languages: ['en'],
        defaultLanguage: 'en',
      }),
      getLanguage: () => ({ language: 'en' }),
      language$: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    } as unknown as AppLanguageApi;
    const translationRef = createTranslationRef({
      id: 'test',
      messages: {
        greeting: 'Default greeting',
        retained: 'Default message',
      },
    });
    const api = I18nextTranslationApi.create({
      languageApi,
      loadJsonTranslations: async () => ({
        test: {
          en: { greeting: 'JSON greeting' },
        },
      }),
    });
    const snapshot = api.getTranslation(translationRef);

    expect(snapshot.ready).toBe(true);
    if (!snapshot.ready) {
      throw new Error('Expected the default translation snapshot to be ready');
    }
    expect(snapshot.t('greeting')).toBe('Default greeting');

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(snapshot.t('greeting')).toBe('JSON greeting');
    expect(snapshot.t('retained')).toBe('Default message');
  });

  it('applies JSON messages over defaults and notifies translation subscribers', async () => {
    const languageApi = {
      getAvailableLanguages: () => ({
        languages: ['en'],
        defaultLanguage: 'en',
      }),
      getLanguage: () => ({ language: 'en' }),
      language$: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    } as unknown as AppLanguageApi;
    const translationRef = createTranslationRef({
      id: 'test',
      messages: {
        greeting: 'Default greeting',
        retained: 'Default message',
      },
    });
    let resolveJsonTranslations!: (
      translations: Record<string, Record<string, Record<string, string>>>,
    ) => void;
    const jsonTranslations = new Promise<
      Record<string, Record<string, Record<string, string>>>
    >(resolve => {
      resolveJsonTranslations = resolve;
    });
    const loadJsonTranslations = jest.fn(() => jsonTranslations);
    const api = I18nextTranslationApi.create({
      languageApi,
      loadJsonTranslations,
    });
    const messages: string[] = [];

    api.translation$(translationRef).subscribe(snapshot => {
      if (snapshot.ready) {
        messages.push(snapshot.t('greeting'), snapshot.t('retained'));
      }
    });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(messages).toEqual(['Default greeting', 'Default message']);

    resolveJsonTranslations({
      test: {
        en: { greeting: 'JSON greeting' },
      },
    });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(messages).toEqual([
      'Default greeting',
      'Default message',
      'JSON greeting',
      'Default message',
    ]);
    expect(loadJsonTranslations).toHaveBeenCalled();
  });
});

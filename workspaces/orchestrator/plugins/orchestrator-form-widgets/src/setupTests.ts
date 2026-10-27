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
import '@testing-library/jest-dom';

const mockLanguageApi = {
  getLanguage: () => ({ language: 'en' }),
  getAvailableLanguages: () => ({ languages: ['en'] }),
  setLanguage: jest.fn(),
  language$: () => ({
    subscribe: () => ({ unsubscribe() {} }),
  }),
};

jest.mock('@backstage/frontend-plugin-api', () => {
  const actual = jest.requireActual('@backstage/frontend-plugin-api');
  return {
    ...actual,
    // Widget unit tests do not mount a full App; provide a stable language API.
    useApi: () => mockLanguageApi,
  };
});

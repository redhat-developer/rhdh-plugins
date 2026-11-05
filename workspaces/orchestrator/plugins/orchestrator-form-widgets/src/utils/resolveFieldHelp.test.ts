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
import { resolveFieldHelp } from './resolveFieldHelp';

describe('resolveFieldHelp', () => {
  it('returns undefined for missing or invalid config', () => {
    expect(resolveFieldHelp(undefined, 'en')).toBeUndefined();
    expect(resolveFieldHelp(null, 'en')).toBeUndefined();
    expect(resolveFieldHelp('help', 'en')).toBeUndefined();
    expect(resolveFieldHelp({ title: 'Only title' }, 'en')).toBeUndefined();
    expect(resolveFieldHelp({ body: '   ' }, 'en')).toBeUndefined();
  });

  it('returns a single content object as-is', () => {
    const content = {
      title: 'Component',
      body: 'Choose the **catalog Component**.',
      link: { label: 'Learn more', url: 'https://example.com' },
    };
    expect(resolveFieldHelp(content, 'fr')).toEqual(content);
  });

  it('selects the matching locale from a map', () => {
    const config = {
      en: { body: 'English help' },
      fr: { body: 'Aide française' },
    };
    expect(resolveFieldHelp(config, 'fr')).toEqual({ body: 'Aide française' });
    expect(resolveFieldHelp(config, 'en')).toEqual({ body: 'English help' });
  });

  it('falls back from en-US to en, then default, then first valid entry', () => {
    expect(
      resolveFieldHelp(
        {
          en: { body: 'English help' },
          fr: { body: 'Aide française' },
        },
        'en-US',
      ),
    ).toEqual({ body: 'English help' });

    expect(
      resolveFieldHelp(
        {
          default: { body: 'Default help' },
          fr: { body: 'Aide française' },
        },
        'de',
      ),
    ).toEqual({ body: 'Default help' });

    expect(
      resolveFieldHelp(
        {
          fr: { body: 'Aide française' },
          ja: { body: '日本語' },
        },
        'de',
      ),
    ).toEqual({ body: 'Aide française' });
  });
});

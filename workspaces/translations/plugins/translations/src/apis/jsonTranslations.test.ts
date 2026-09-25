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

import { createJsonTranslationsLoader } from './jsonTranslations';

describe('createJsonTranslationsLoader', () => {
  it('retries a failed request and caches the successful result', async () => {
    const translations = { test: { en: { greeting: 'Hello' } } };
    const request = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValue(translations);
    const onError = jest.fn();
    const load = createJsonTranslationsLoader(request, onError);

    await expect(Promise.all([load(), load()])).resolves.toEqual([
      translations,
      translations,
    ]);
    await expect(load()).resolves.toBe(translations);

    expect(request).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });

  it('allows a later request to recover after both attempts fail', async () => {
    const translations = { test: { en: { greeting: 'Hello' } } };
    const request = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockRejectedValueOnce(new Error('still unavailable'))
      .mockResolvedValue(translations);
    const onError = jest.fn();
    const load = createJsonTranslationsLoader(request, onError);

    await expect(load()).resolves.toEqual({});
    await expect(load()).resolves.toBe(translations);

    expect(request).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(new Error('still unavailable'));
  });
});

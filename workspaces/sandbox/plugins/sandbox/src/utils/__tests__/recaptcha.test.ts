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
import { loadRecaptchaScript } from '../recaptcha';

describe('recaptcha utils', () => {
  const mockApiKey = 'test-api-key';
  const expectedScriptUrl = `https://www.google.com/recaptcha/enterprise.js?render=${mockApiKey}`;

  beforeEach(() => {
    // Clean up any scripts added to document.head
    document.head.innerHTML = '';
  });

  it('should add recaptcha script when API key is provided', () => {
    loadRecaptchaScript(mockApiKey);

    const scriptElement = document.querySelector(
      `script[src="${expectedScriptUrl}"]`,
    ) as HTMLScriptElement;
    expect(scriptElement).toBeTruthy();
    expect(scriptElement.getAttribute('type')).toBe('text/javascript');
    expect(scriptElement.async).toBe(true);
    expect(scriptElement.defer).toBe(true);
  });

  it('should not add script when API key is empty', () => {
    loadRecaptchaScript('');

    const scriptElement = document.querySelector('script');
    expect(scriptElement).toBeFalsy();
  });

  it('should not add duplicate script if already exists', () => {
    // Add script first time
    loadRecaptchaScript(mockApiKey);

    // Try to add script second time
    loadRecaptchaScript(mockApiKey);

    // Check that only one script exists
    const scriptElements = document.querySelectorAll(
      `script[src="${expectedScriptUrl}"]`,
    );
    expect(scriptElements.length).toBe(1);
  });
});

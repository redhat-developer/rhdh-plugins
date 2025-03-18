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
export const loadRecaptchaScript = (recaptchaApiKey: string): void => {
  if (recaptchaApiKey) {
    const url = `https://www.google.com/recaptcha/enterprise.js?render=${recaptchaApiKey}`;
    const recaptchaScriptNode = document.querySelector(`script[src="${url}"]`);
    if (!recaptchaScriptNode) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      script.async = true;
      script.defer = true;

      document.head.appendChild(script);
    }
  }
};

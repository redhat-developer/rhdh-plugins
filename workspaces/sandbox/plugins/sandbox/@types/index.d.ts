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
declare let grecaptcha: {
  enterprise: ReCaptchaV3.ReCaptcha;
};

declare namespace ReCaptchaV3 {
  interface ReCaptcha {
    execute(siteKey: string, action: Action): PromiseLike<string>;
    ready(callback: () => void): void;
  }
  interface Action {
    /**
     * the name of the action. Actions may only contain alphanumeric characters and slashes, and must not be user-specific.
     */
    action: string;
  }
}

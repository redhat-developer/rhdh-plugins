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

/**
 * New Frontend System: RHDH sign-in and auth API extensions for the app plugin.
 *
 * The sign-in page UI is not re-exported here — it loads via
 * {@link appAuthModule}'s SignInPageBlueprint loader so MUI / core-components
 * stay off the Module Federation alpha sync chunk.
 *
 * @packageDocumentation
 */

export { appAuthModule } from './appAuthModule';
export * from './AuthApiRefs';
export * from './translations/signIn';

export { appAuthModule as default } from './appAuthModule';

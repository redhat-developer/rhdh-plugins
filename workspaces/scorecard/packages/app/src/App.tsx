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

import { createApp } from '@backstage/frontend-defaults';

import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';
import {
  scorecardTranslationsModule,
  scorecardCatalogModule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard/alpha';
import { signInModule } from './modules/signIn';
import { navModule } from './modules/nav';

/*
 * app: Backstage app using the New Frontend System (NFS).
 */
const app = createApp({
  features: [
    rhdhThemeModule,
    scorecardCatalogModule,
    scorecardTranslationsModule,
    signInModule,
    navModule,
  ],
});

export default app.createRoot();

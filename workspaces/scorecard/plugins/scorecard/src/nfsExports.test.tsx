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

import scorecardPlugin, {
  scorecardCatalogModule,
  scorecardHomeModule,
  scorecardTranslationsModule,
} from './index';

describe('scorecard NFS exports', () => {
  it('should export the scorecard plugin as default', () => {
    expect(scorecardPlugin).toBeDefined();
  });

  it('should export scorecardCatalogModule', () => {
    expect(scorecardCatalogModule).toBeDefined();
  });

  it('should export scorecardHomeModule', () => {
    expect(scorecardHomeModule).toBeDefined();
  });

  it('should export scorecardTranslationsModule', () => {
    expect(scorecardTranslationsModule).toBeDefined();
  });
});

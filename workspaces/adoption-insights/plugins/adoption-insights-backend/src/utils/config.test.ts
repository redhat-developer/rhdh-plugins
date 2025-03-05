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
import { mockServices } from '@backstage/backend-test-utils';
import { getConfigurationOptions } from './config';

describe('getConfigurationOptions', () => {
  it('should return the default values', () => {
    expect(getConfigurationOptions(mockServices.rootConfig.mock())).toEqual({
      batchInterval: 2000,
      batchSize: 5,
      debug: false,
    });
  });
  it('should return the configured values', () => {
    const mockConfig = mockServices.rootConfig.mock({
      getOptionalNumber: jest.fn(key => {
        if (key === 'app.analytics.adoptionInsights.maxBufferSize') {
          return 3;
        }
        return 1000;
      }),
    });
    expect(getConfigurationOptions(mockConfig)).toEqual({
      batchInterval: 1000,
      batchSize: 3,
      debug: false,
    });
  });
});

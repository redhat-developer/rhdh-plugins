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

import { Deployment } from '../schemas/deploymentSchemas';
import {
  isProductionEnvironment,
  isSuccessfulProductionDeployment,
} from './deploymentFilterUtils';

describe('deploymentFilterUtils', () => {
  describe('isProductionEnvironment', () => {
    it('treats missing environment as production', () => {
      expect(isProductionEnvironment(undefined, ['production'])).toBe(true);
    });

    it('matches any configured environment name case-insensitively', () => {
      expect(isProductionEnvironment('Prod', ['production', 'prod'])).toBe(
        true,
      );
      expect(isProductionEnvironment('staging', ['production', 'prod'])).toBe(
        false,
      );
    });
  });

  describe('isSuccessfulProductionDeployment', () => {
    it('requires success and a production environment', () => {
      expect(
        isSuccessfulProductionDeployment(
          { result: 'success', environment: 'production' } as Deployment,
          ['production'],
        ),
      ).toBe(true);
      expect(
        isSuccessfulProductionDeployment(
          { result: 'failure', environment: 'production' } as Deployment,
          ['production'],
        ),
      ).toBe(false);
      expect(
        isSuccessfulProductionDeployment(
          { result: 'success', environment: 'development' } as Deployment,
          ['production'],
        ),
      ).toBe(false);
    });
  });
});

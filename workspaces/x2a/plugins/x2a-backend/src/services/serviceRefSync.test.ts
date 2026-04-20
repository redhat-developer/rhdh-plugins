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
 * Guard tests: x2a-backend re-exports the canonical refs from x2a-node.
 * These tests verify the re-export is the exact same object (identity)
 * so Backstage can wire deps across plugins.
 */
import {
  x2aDatabaseServiceRef as nodeDbRef,
  kubeServiceRef as nodeKubeRef,
  X2A_DATABASE_SERVICE_ID,
  KUBE_SERVICE_ID,
} from '@red-hat-developer-hub/backstage-plugin-x2a-node';
import { x2aDatabaseServiceRef } from './X2ADatabaseService';
import { kubeServiceRef } from './KubeService';

describe('service ref identity with x2a-node', () => {
  it('x2a-backend re-exports the exact same x2aDatabaseServiceRef object', () => {
    expect(x2aDatabaseServiceRef).toBe(nodeDbRef);
    expect(x2aDatabaseServiceRef.id).toBe(X2A_DATABASE_SERVICE_ID);
  });

  it('x2a-backend re-exports the exact same kubeServiceRef object', () => {
    expect(kubeServiceRef).toBe(nodeKubeRef);
    expect(kubeServiceRef.id).toBe(KUBE_SERVICE_ID);
  });
});

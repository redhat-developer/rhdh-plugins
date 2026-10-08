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

import { dbDeployment } from '../__fixtures__';
import { prependPreWindowDeployment } from './preWindowDeploymentUtils';

describe('prependPreWindowDeployment', () => {
  const inWindow = [
    dbDeployment({
      id: '101',
      commitSha: 'sha-in-window',
      environment: 'production',
      createdAt: '2026-06-08T12:00:00.000Z',
    }),
  ];

  it('returns in-window deployments unchanged when there is no pre-window deploy', () => {
    expect(prependPreWindowDeployment(undefined, inWindow)).toBe(inWindow);
  });

  it('prepends the pre-window deploy when one exists', () => {
    const preWindow = dbDeployment({
      id: '100',
      commitSha: 'sha-pre-window',
      environment: 'production',
      createdAt: '2026-05-20T12:00:00.000Z',
    });

    expect(prependPreWindowDeployment(preWindow, inWindow)).toEqual([
      preWindow,
      ...inWindow,
    ]);
  });
});

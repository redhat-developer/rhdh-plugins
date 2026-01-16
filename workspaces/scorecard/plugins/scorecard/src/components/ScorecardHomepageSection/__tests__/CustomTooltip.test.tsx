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

import { render, screen } from '@testing-library/react';

import { CustomTooltip } from '../CustomTooltip';

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      switch (key) {
        case 'thresholds.entities':
          return `${options?.count} entities`;
        case 'thresholds.noEntities':
          return `No entities in ${options?.category} state`;
        case 'thresholds.Test':
          return 'Test';
        case 'errors.missingPermissionMessage':
          return 'Missing permission';
        default:
          return key;
      }
    },
  }),
}));

describe('CustomTooltip Component', () => {
  it('should render entity count and percentage when entities exist', () => {
    render(
      <CustomTooltip
        payload={[{ name: 'Test', value: 10 }]}
        pieData={[{ name: 'Test', value: 10, color: 'red' }]}
      />,
    );

    expect(screen.getByText('10 entities')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should render no-entities message when value is zero', () => {
    render(
      <CustomTooltip
        payload={[{ name: 'Test', value: 0 }]}
        pieData={[{ name: 'Test', value: 0, color: 'red' }]}
      />,
    );

    expect(screen.getByText('No entities in Test state')).toBeInTheDocument();
  });

  it('should render missing permission message when isMissingPermission is true', () => {
    render(
      <CustomTooltip
        isMissingPermission
        payload={[{ name: 'Test', value: 10 }]}
        pieData={[{ name: 'Test', value: 10, color: 'red' }]}
      />,
    );

    expect(screen.getByText('Missing permission')).toBeInTheDocument();
  });
});

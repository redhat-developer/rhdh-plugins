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

describe('CustomTooltip Component', () => {
  it('should render with the correct content when there are entities', () => {
    render(
      <CustomTooltip
        payload={[{ name: 'Test', value: 10 }]}
        pieData={[{ name: 'Test', value: 10 }]}
      />,
    );
    expect(screen.getByText('10 entities')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should render with the correct content when there are no entities', () => {
    render(
      <CustomTooltip
        payload={[{ name: 'Test', value: 0 }]}
        pieData={[{ name: 'Test', value: 0 }]}
      />,
    );
    expect(screen.getByText('No entities in Test state')).toBeInTheDocument();
  });

  it('should render with the correct content when there is no payload', () => {
    render(
      <CustomTooltip payload={null} pieData={[{ name: 'Test', value: 10 }]} />,
    );
    expect(null).toBeNull();
  });
});

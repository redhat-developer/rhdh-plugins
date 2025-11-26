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

import CustomLegend from '../CustomLegend';

describe('CustomLegend Component', () => {
  it('should render with the correct number of legend items', () => {
    render(
      <CustomLegend
        payload={[{ name: 'Test', value: 10, color: 'red' }]}
        pieData={[{ name: 'Test', value: 10, color: 'red' }]}
      />,
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should render with the correct value for the legend item', () => {
    render(
      <CustomLegend
        payload={[{ name: 'Test', value: 10, color: 'red' }]}
        pieData={[{ name: 'Test', value: 10, color: 'red' }]}
      />,
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should render null if there are no payload', () => {
    render(
      <CustomLegend
        payload={null}
        pieData={[{ name: 'Test', value: 10, color: 'red' }]}
      />,
    );
    expect(null).toBeNull();
  });
});

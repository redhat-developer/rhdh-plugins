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
import { wrapInTestApp } from '@backstage/test-utils';
import { Router } from './Router';

jest.mock('./pages/data-center/DataCenterPage', () => ({
  DataCenterPage: () => <div>DataCenterPage</div>,
}));
jest.mock('./pages/environment-details', () => ({
  EnvironmentDetailsPage: () => <div>EnvironmentDetailsPage</div>,
}));
jest.mock('./pages/service-spec-details', () => ({
  ServiceSpecDetailsPage: () => <div>ServiceSpecDetailsPage</div>,
}));

describe('Router', () => {
  it('renders DataCenterPage on the default route', () => {
    render(wrapInTestApp(<Router />));
    expect(screen.getByText('DataCenterPage')).toBeInTheDocument();
  });

  it('renders ServiceSpecDetailsPage for service-specs/:id/* routes', () => {
    render(wrapInTestApp(<Router />, { routeEntries: ['/service-specs/123'] }));
    expect(screen.getByText('ServiceSpecDetailsPage')).toBeInTheDocument();
  });

  it('renders EnvironmentDetailsPage for environments/:id/* routes', () => {
    render(wrapInTestApp(<Router />, { routeEntries: ['/environments/456'] }));
    expect(screen.getByText('EnvironmentDetailsPage')).toBeInTheDocument();
  });
});

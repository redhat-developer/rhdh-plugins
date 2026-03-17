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

import { OwnerCell } from '../OwnerCell';

jest.mock('@backstage/core-components', () => {
  const React = require('react');
  return {
    Link: React.forwardRef(
      (
        { to, children, ...props }: { to: string; children: React.ReactNode },
        ref: React.Ref<HTMLAnchorElement>,
      ) => (
        <a ref={ref} href={to} {...props}>
          {children}
        </a>
      ),
    ),
  };
});

const mockEntityLink = jest.fn();
jest.mock('@backstage/core-plugin-api', () => ({
  useRouteRef: () => mockEntityLink,
}));

jest.mock('@backstage/catalog-model', () =>
  jest.requireActual('@backstage/catalog-model'),
);

const mockUseEntityPresentation = jest.fn();
jest.mock('@backstage/plugin-catalog-react', () => ({
  entityRouteRef: { id: 'entity-route' },
  useEntityPresentation: (ref: string) => mockUseEntityPresentation(ref),
}));

describe('OwnerCell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEntityLink.mockReturnValue('/catalog/default/group/team-a');
    mockUseEntityPresentation.mockReturnValue({
      primaryTitle: 'Team A',
      secondaryTitle: 'group:default/team-a',
    });
  });

  it('should render -- when ownerRef is undefined', () => {
    render(<OwnerCell />);

    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('should render -- when ownerRef is empty string', () => {
    render(<OwnerCell ownerRef="" />);

    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('should render link with primary title when ownerRef is provided', () => {
    render(<OwnerCell ownerRef="team:default/team-a" />);

    expect(screen.getByText('Team A')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/catalog/default/group/team-a');
    expect(link).toHaveTextContent('Team A');
  });

  it('should resolve short owner ref to group:default/ ref', () => {
    mockUseEntityPresentation.mockReturnValue({
      primaryTitle: 'Platform',
      secondaryTitle: 'group:default/platform',
    });
    mockEntityLink.mockReturnValue('/catalog/default/group/platform');

    render(<OwnerCell ownerRef="platform" />);

    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(mockUseEntityPresentation).toHaveBeenCalledWith(
      'group:default/platform',
    );
  });

  it('should pass full ref when ownerRef already contains colon', () => {
    render(<OwnerCell ownerRef="group:default/team-a" />);

    expect(mockUseEntityPresentation).toHaveBeenCalledWith(
      'group:default/team-a',
    );
  });
});

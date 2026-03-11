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

import { EntityNameCell } from '../EntityNameCell';

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

jest.mock('@backstage/plugin-catalog-react', () => ({
  entityRouteRef: { id: 'entity-route' },
}));

describe('EntityNameCell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEntityLink.mockImplementation(
      (params: { kind: string; namespace: string; name: string }) =>
        `/catalog/${params.namespace}/${params.kind}/${params.name}`,
    );
  });

  it('should render entity name from parseEntityRef when no entityMetadata', () => {
    render(<EntityNameCell entityRef="component:default/my-service" />);

    expect(screen.getByText('my-service')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      '/catalog/default/component/my-service',
    );
    expect(link).toHaveTextContent('my-service');
  });

  it('should prefer entityMetadata.title over parsed name', () => {
    render(
      <EntityNameCell
        entityRef="component:default/my-service"
        entityMetadata={{ title: 'My Service Display Name' }}
      />,
    );

    expect(screen.getByText('My Service Display Name')).toBeInTheDocument();
  });

  it('should use parsed name when entityMetadata has no title', () => {
    render(
      <EntityNameCell
        entityRef="component:default/backend-service"
        entityMetadata={{}}
      />,
    );
    expect(screen.getByText('backend-service')).toBeInTheDocument();
  });

  it('should build tooltip from entityRef, kind, and description', () => {
    render(
      <EntityNameCell
        entityRef="component:default/my-service"
        entityMetadata={{
          title: 'My Service',
          kind: 'Component',
          description: 'A backend service',
        }}
      />,
    );

    expect(screen.getByText('My Service')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('My Service');
    expect(link).toHaveAttribute(
      'aria-label',
      'component:default/my-service | Component | A backend service',
    );
  });

  it('should pass parsed kind, namespace, name to entityLink', () => {
    mockEntityLink.mockReturnValue('/custom/path');

    render(<EntityNameCell entityRef="component:staging/frontend-app" />);

    expect(mockEntityLink).toHaveBeenCalledWith({
      kind: 'component',
      namespace: 'staging',
      name: 'frontend-app',
    });
  });
});

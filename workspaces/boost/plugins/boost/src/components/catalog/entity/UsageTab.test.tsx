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

import type { Entity } from '@backstage/catalog-model';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { usePermission } from '@backstage/plugin-permission-react';
import { renderInTestApp } from '@backstage/test-utils';
import { screen } from '@testing-library/react';

import { boostMessages } from '../../../translations/ref';
import { UsageTab } from './UsageTab';

const { catalog: msg } = boostMessages;

jest.mock('@backstage/plugin-catalog-react', () => ({
  useEntity: jest.fn(),
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: jest.fn(),
}));

const mockUseEntity = useEntity as jest.MockedFunction<typeof useEntity>;
const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;

const entityWithTechDocs: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill',
    namespace: 'default',
    uid: 'uid-1',
    annotations: {
      'backstage.io/techdocs-ref': 'dir:.',
    },
  },
  spec: {
    type: 'skill',
    owner: 'team-ai-platform',
  },
};

const entityWithLinks: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'security-scanner',
    namespace: 'default',
    uid: 'uid-2',
    links: [{ url: 'https://example.com/docs', title: 'API Documentation' }],
  },
  spec: {
    type: 'skill',
    owner: 'team-security',
  },
};

const entityNoDocs: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'plain-asset',
    namespace: 'default',
    uid: 'uid-3',
  },
  spec: {
    type: 'skill',
    owner: 'team-integrations',
  },
};

const entityNoOwner: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'ownerless-asset',
    namespace: 'default',
    uid: 'uid-4',
  },
  spec: {
    type: 'skill',
  },
};

const entityWithQualifiedOwner: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'qualified-owner-asset',
    namespace: 'default',
    uid: 'uid-5',
  },
  spec: {
    type: 'skill',
    owner: 'user:default/jdoe',
  },
};

function setEntity(entity: Entity) {
  mockUseEntity.mockReturnValue({
    entity,
  } as ReturnType<typeof useEntity>);
}

function setPermission(result: { loading: boolean; allowed: boolean }) {
  mockUsePermission.mockReturnValue(result);
}

describe('UsageTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading skeleton while permission is loading', async () => {
    setEntity(entityWithTechDocs);
    setPermission({ loading: true, allowed: false });

    await renderInTestApp(<UsageTab />);

    // Should not render the title, docs, or contact owner
    expect(screen.queryByText(msg.tab.usageTitle)).not.toBeInTheDocument();
    expect(
      screen.queryByText(msg.tab.usageViewTechDocs),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(msg.tab.usageContactOwner),
    ).not.toBeInTheDocument();
  });

  it('renders TechDocs link when permission is allowed and entity has TechDocs', async () => {
    setEntity(entityWithTechDocs);
    setPermission({ loading: false, allowed: true });

    await renderInTestApp(<UsageTab />);

    expect(screen.getByText(msg.tab.usageTitle)).toBeInTheDocument();
    expect(screen.getByText(msg.tab.usageViewTechDocs)).toBeInTheDocument();
    const link = screen.getByRole('link', {
      name: msg.tab.usageViewTechDocs,
    });
    expect(link).toHaveAttribute(
      'href',
      '/docs/default/airesource/code-review-skill',
    );
  });

  it('checks the permission with a resourceRef for the current entity', async () => {
    setEntity(entityWithTechDocs);
    setPermission({ loading: false, allowed: true });

    await renderInTestApp(<UsageTab />);

    expect(mockUsePermission).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceRef: stringifyEntityRef(entityWithTechDocs),
      }),
    );
  });

  it('renders external links when permission is allowed and entity has links', async () => {
    setEntity(entityWithLinks);
    setPermission({ loading: false, allowed: true });

    await renderInTestApp(<UsageTab />);

    expect(screen.getByText(msg.tab.usageTitle)).toBeInTheDocument();
    expect(screen.getByText('API Documentation')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'API Documentation' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
  });

  it('renders no-documentation message when permission is allowed but no docs exist', async () => {
    setEntity(entityNoDocs);
    setPermission({ loading: false, allowed: true });

    await renderInTestApp(<UsageTab />);

    expect(screen.getByText(msg.tab.usageTitle)).toBeInTheDocument();
    expect(screen.getByText(msg.tab.usageNoDocumentation)).toBeInTheDocument();
  });

  it('renders permission denied message with contact owner link when denied and entity has owner', async () => {
    setEntity(entityWithTechDocs);
    setPermission({ loading: false, allowed: false });

    await renderInTestApp(<UsageTab />);

    expect(screen.getByText(msg.tab.usageTitle)).toBeInTheDocument();
    expect(screen.getByText(msg.tab.usagePermissionDenied)).toBeInTheDocument();

    const contactLink = screen.getByRole('link', {
      name: msg.tab.usageContactOwner,
    });
    expect(contactLink).toHaveAttribute(
      'href',
      '/catalog/default/group/team-ai-platform',
    );

    // Must not leak any documentation content
    expect(
      screen.queryByText(msg.tab.usageViewTechDocs),
    ).not.toBeInTheDocument();
  });

  it('renders permission denied message without contact link when denied and entity has no owner', async () => {
    setEntity(entityNoOwner);
    setPermission({ loading: false, allowed: false });

    await renderInTestApp(<UsageTab />);

    expect(screen.getByText(msg.tab.usagePermissionDenied)).toBeInTheDocument();
    expect(
      screen.queryByText(msg.tab.usageContactOwner),
    ).not.toBeInTheDocument();
  });

  it('builds the contact owner link from a fully-qualified owner ref', async () => {
    setEntity(entityWithQualifiedOwner);
    setPermission({ loading: false, allowed: false });

    await renderInTestApp(<UsageTab />);

    const contactLink = screen.getByRole('link', {
      name: msg.tab.usageContactOwner,
    });
    expect(contactLink).toHaveAttribute('href', '/catalog/default/user/jdoe');
  });
});

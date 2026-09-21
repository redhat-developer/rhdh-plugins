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

import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import type { EntityContentLayoutProps } from '@backstage/plugin-catalog-react/alpha';

import { EntityOverviewLayout } from './entityOverviewLayout';

jest.mock('@backstage/plugin-catalog', () => {
  const EntitySwitch = ({ children }: { children?: ReactNode }) => (
    <>{children}</>
  );
  EntitySwitch.Case = () => null;
  return {
    EntityOrphanWarning: () => null,
    EntityProcessingErrorsPanel: () => null,
    EntityRelationWarning: () => null,
    EntitySwitch,
    hasCatalogProcessingErrors: () => false,
    hasRelationWarnings: () => false,
    isOrphan: () => false,
  };
});

jest.mock('./entityPage/Grid', () => ({
  Grid: ({
    children,
    container,
    sx,
  }: {
    children?: ReactNode;
    container?: boolean;
    item?: boolean;
    sx?: { gridColumn?: unknown };
  }) => {
    if (container) {
      return <div data-testid="grid-container">{children}</div>;
    }
    return (
      <div
        data-testid="grid-item"
        data-grid-column={JSON.stringify(sx?.gridColumn ?? null)}
      >
        {children}
      </div>
    );
  },
}));

const leftColumn = {
  lg: '1 / span 4',
  md: '1 / span 6',
  xs: '1 / -1',
};

const rightColumn = {
  lg: '5 / -1',
  md: '7 / -1',
  xs: '1 / -1',
};

const fullWidthColumn = {
  xs: '1 / -1',
};

type Card = EntityContentLayoutProps['cards'][number];

const card = (label: string, type?: Card['type']): Card => ({
  type,
  element: <div data-testid={`card-${label}`}>{label}</div>,
});

/** Walk ancestors for the layout column assigned to this card. */
function layoutColumnFor(testId: string): unknown {
  let node: HTMLElement | null = screen.getByTestId(testId).parentElement;
  let nestedFullWidth: string | undefined;
  while (node) {
    const raw = node.getAttribute('data-grid-column');
    if (raw && raw !== 'null') {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === 'string') {
        // Nested card wrappers use '1 / -1'; prefer an outer layout config.
        if (parsed === '1 / -1') {
          nestedFullWidth ??= parsed;
        } else {
          return parsed;
        }
      } else if (parsed && typeof parsed === 'object') {
        const col = parsed as Record<string, string>;
        if ('lg' in col || (col.xs === '1 / -1' && !('md' in col))) {
          return parsed;
        }
      }
    }
    node = node.parentElement;
  }
  if (nestedFullWidth !== undefined) {
    return nestedFullWidth;
  }
  throw new Error(`No layout gridColumn found for ${testId}`);
}

describe('EntityOverviewLayout', () => {
  it('places info left and content right when both are present', () => {
    render(
      <EntityOverviewLayout
        cards={[card('about', 'info'), card('relations', 'content')]}
      />,
    );

    expect(layoutColumnFor('card-about')).toEqual(leftColumn);
    expect(layoutColumnFor('card-relations')).toEqual(rightColumn);
  });

  it('lets content span full width when info is absent', () => {
    render(<EntityOverviewLayout cards={[card('relations', 'content')]} />);

    expect(layoutColumnFor('card-relations')).toEqual(fullWidthColumn);
  });

  it('keeps info in the left column when content is absent', () => {
    render(<EntityOverviewLayout cards={[card('about', 'info')]} />);

    expect(layoutColumnFor('card-about')).toEqual(leftColumn);
    expect(screen.queryByTestId('card-relations')).not.toBeInTheDocument();
  });

  it('treats cards without a type as content', () => {
    render(
      <EntityOverviewLayout cards={[card('about', 'info'), card('untyped')]} />,
    );

    expect(layoutColumnFor('card-about')).toEqual(leftColumn);
    expect(layoutColumnFor('card-untyped')).toEqual(rightColumn);
  });

  it('places unknown card types full width', () => {
    render(
      <EntityOverviewLayout
        cards={[
          {
            // Entity card types are normally info|content; unknown types are
            // routed to the ungrouped full-width lane.
            type: 'other' as Card['type'],
            element: <div data-testid="card-other">other</div>,
          },
        ]}
      />,
    );

    expect(layoutColumnFor('card-other')).toBe('1 / -1');
  });
});

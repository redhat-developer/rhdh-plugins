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

import { useMemo } from 'react';
import { ErrorBoundary } from '@backstage/core-components';
import { Flex } from '@backstage/ui';
import type { AppHeaderData } from '@red-hat-developer-hub/backstage-plugin-app-react';

/**
 * Props for {@link AppHeaders}.
 *
 * @public
 */
export interface AppHeadersProps {
  /** Headers contributed via `AppHeaderBlueprint`. */
  headers: AppHeaderData[];
}

/**
 * Sorts headers by priority, higher first. Ties are broken by extension id so
 * the order is stable regardless of the order the extensions were installed.
 */
export function sortAppHeaders(headers: AppHeaderData[]): AppHeaderData[] {
  return [...headers].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id),
  );
}

/**
 * Renders all headers contributed via `AppHeaderBlueprint`, stacked from
 * the highest to the lowest priority. Each header is wrapped in an error
 * boundary so a failing header does not take down the others or the rest of
 * the app. Renders nothing when no headers are registered.
 *
 * @public
 */
export const AppHeaders = ({ headers }: AppHeadersProps) => {
  const sorted = useMemo(() => sortAppHeaders(headers), [headers]);

  if (sorted.length === 0) {
    return null;
  }

  return (
    <Flex id="rhdh-app-headers" direction="column" gap="0" shrink={false}>
      {sorted.map(header => {
        const Header = header.component;
        return (
          <ErrorBoundary key={header.id}>
            <Header />
          </ErrorBoundary>
        );
      })}
    </Flex>
  );
};

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

import { PropsWithChildren, type ReactNode } from 'react';

import { Content, Header, Page } from '@backstage/core-components';

export interface BaseOrchestratorProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Document / breadcrumb title when `title` is a React node. */
  pageTitleOverride?: string;
  type?: string;
  typeLink?: string;
  noPadding?: boolean;
  /**
   * Page-level actions for `@backstage/core-components` Header.
   * Passed as Header `children` (right side) — same slot Catalog NFS fills
   * with `@backstage/ui` Header `customActions`.
   */
  headerAction?: ReactNode;
}

export const BaseOrchestratorPage = ({
  title,
  subtitle,
  pageTitleOverride,
  type,
  typeLink,
  noPadding,
  headerAction,
  children,
}: PropsWithChildren<BaseOrchestratorProps>) => {
  return (
    <Page themeId="tool">
      <Header
        title={title}
        subtitle={subtitle}
        pageTitleOverride={pageTitleOverride}
        type={type}
        typeLink={typeLink}
      >
        {headerAction}
      </Header>
      <Content noPadding={noPadding}>{children}</Content>
    </Page>
  );
};

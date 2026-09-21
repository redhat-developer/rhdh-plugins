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

import type { ComponentType } from 'react';

import {
  ExtensionBoundary,
  type AppNode,
} from '@backstage/frontend-plugin-api';

/**
 * Wraps an async component loader in an ExtensionBoundary + Suspense so
 * suspending items do not bubble to the app-root Suspense around the header.
 */
export function resolveLazyComponent(
  node: AppNode,
  loader: () => Promise<ComponentType<any>>,
): ComponentType<any> {
  return ExtensionBoundary.lazyComponent(node, async () => {
    const Comp = await loader();
    return (props: any) => <Comp {...props} />;
  });
}

/** Wraps a sync component in an ExtensionBoundary. */
export function resolveSyncComponent(
  node: AppNode,
  Comp: ComponentType<any>,
): ComponentType<any> {
  return (props: any) => (
    <ExtensionBoundary node={node}>
      <Comp {...props} />
    </ExtensionBoundary>
  );
}

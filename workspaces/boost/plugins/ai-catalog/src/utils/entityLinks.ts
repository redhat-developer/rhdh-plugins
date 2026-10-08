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

import { parseEntityRef } from '@backstage/catalog-model';
import type { Entity } from '@backstage/catalog-model';

function catalogHref(kind: string, namespace: string, name: string): string {
  return `/catalog/${namespace}/${kind.toLowerCase()}/${name}`;
}

export function entityHref(entity: Entity): string {
  const namespace = entity.metadata.namespace ?? 'default';
  return catalogHref(entity.kind, namespace, entity.metadata.name);
}

/**
 * Builds a catalog entity page URL from an entity ref string (e.g. an
 * owner value from `spec.owner`). Bare names default to a group in the
 * default namespace, matching common Backstage conventions for owners.
 */
export function entityRefHref(ref: string): string | undefined {
  try {
    const { kind, namespace, name } = parseEntityRef(ref, {
      defaultKind: 'group',
      defaultNamespace: 'default',
    });
    return catalogHref(kind, namespace, name);
  } catch {
    return undefined;
  }
}

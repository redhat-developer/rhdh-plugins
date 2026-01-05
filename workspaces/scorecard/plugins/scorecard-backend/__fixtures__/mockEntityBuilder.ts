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

export class MockEntityBuilder {
  private kind: string = 'Component';
  private metadata: Entity['metadata'] = {
    name: 'default-component',
    namespace: 'default',
  };
  private spec: Entity['spec'] = {
    owner: 'guests',
  };

  withKind(kind: string): this {
    this.kind = kind;
    return this;
  }

  withMetadata(metadata: Entity['metadata']): this {
    this.metadata = metadata;
    return this;
  }

  withSpec(spec: Entity['spec']): this {
    this.spec = spec;
    return this;
  }

  build(): Entity {
    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: this.kind,
      metadata: this.metadata,
      spec: this.spec,
    };
  }
}

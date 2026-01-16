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

import { createPermission } from '@backstage/plugin-permission-common';

/** @public */
export const rosPluginReadPermission = createPermission({
  name: 'ros.plugin',
  attributes: { action: 'read' },
});

/** @public */
export const rosClusterSpecificPermission = (clusterName: string) =>
  createPermission({
    name: `ros.${clusterName}`,
    attributes: { action: 'read' },
  });

/** @public */
export const rosClusterProjectPermission = (
  clusterName: string,
  projectName: string,
) =>
  createPermission({
    name: `ros.${clusterName}.${projectName}`,
    attributes: { action: 'read' },
  });

/** @public */
export const costPluginReadPermission = createPermission({
  name: 'cost.plugin',
  attributes: { action: 'read' },
});

/** @public */
export const costClusterSpecificPermission = (clusterName: string) =>
  createPermission({
    name: `cost.${clusterName}`,
    attributes: { action: 'read' },
  });

/** @public */
export const costClusterProjectPermission = (
  clusterName: string,
  projectName: string,
) =>
  createPermission({
    name: `cost.${clusterName}.${projectName}`,
    attributes: { action: 'read' },
  });

/** @public */
export const costPluginPermissions = [costPluginReadPermission];

/** @public */
export const rosPluginPermissions = [rosPluginReadPermission];

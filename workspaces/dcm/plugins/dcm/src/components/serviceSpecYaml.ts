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

import {
  formatServiceSpecCpu,
  formatServiceSpecRam,
  type ServiceSpec,
} from '../data/service-specs';

function formatYamlList(values: string[]): string {
  if (values.length === 0) {
    return '[]';
  }

  const items = values.map(v => `    - ${v}`).join('\n');
  return `\n${items}`;
}

export function buildServiceSpecYaml(spec: ServiceSpec): string {
  const packs = formatYamlList(spec.policyPacks);
  const envSup = formatYamlList(spec.envSupport);
  const tags = formatYamlList(spec.tags);
  return `kind: ServiceSpec
metadata:
  id: ${spec.id}
  name: ${spec.name}
spec:
  cpu: ${formatServiceSpecCpu(spec.cpu)}
  ram: ${formatServiceSpecRam(spec.ram)}
  env: ${spec.environment}
  resourceType: ${spec.resourceType}
  envSupport: ${envSup}
  tags: ${tags}
  estDeploymentTime: ${spec.estDeploymentTime}
  costTier: ${spec.costTier}
  vCPU: ${spec.cpu}
  ramGb: ${spec.ram}
  storage:
    os: 20
  policyPacks: ${packs}
  port: ${spec.port}
  protocol: ${spec.protocol}
`;
}

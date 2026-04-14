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

import type {
  KagentiCreateAgentRequest,
  KagentiEnvVar,
  KagentiServicePort,
  KagentiShipwrightConfig,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { EnvRow, FormState, ServicePortRow } from './agentWizardTypes';
import type { MutableRefObject } from 'react';

export function nextRowId(ref: MutableRefObject<number>): number {
  ref.current += 1;
  return ref.current;
}

export function buildEnvVars(rows: EnvRow[]): KagentiEnvVar[] | undefined {
  const list = rows
    .filter(r => r.name.trim())
    .map(r => {
      const ev: KagentiEnvVar = { name: r.name.trim() };
      if (r.source === 'secret' && r.refName.trim() && r.refKey.trim()) {
        ev.valueFrom = {
          secretKeyRef: { name: r.refName.trim(), key: r.refKey.trim() },
        };
      } else if (
        r.source === 'configMap' &&
        r.refName.trim() &&
        r.refKey.trim()
      ) {
        ev.valueFrom = {
          configMapKeyRef: { name: r.refName.trim(), key: r.refKey.trim() },
        };
      } else if (r.value.trim()) {
        ev.value = r.value.trim();
      }
      return ev;
    });
  return list.length ? list : undefined;
}

export function parsePositivePort(s: string): number | undefined {
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  const p = Math.floor(n);
  if (p < 1 || p > 65535) return undefined;
  return p;
}

export function buildServicePorts(
  rows: ServicePortRow[],
): KagentiServicePort[] | undefined {
  const list = rows
    .map(r => {
      const port = parsePositivePort(r.port);
      if (port === undefined) return null;
      const sp: KagentiServicePort = { port, protocol: r.protocol };
      if (r.name.trim()) sp.name = r.name.trim();
      const tp = parsePositivePort(r.targetPort);
      if (tp !== undefined) sp.targetPort = tp;
      return sp;
    })
    .filter((x): x is KagentiServicePort => x !== null);
  return list.length ? list : undefined;
}

export function buildRequest(s: FormState): KagentiCreateAgentRequest {
  const body: KagentiCreateAgentRequest = {
    name: s.name.trim(),
    namespace: s.namespace.trim(),
    deploymentMethod: s.deploymentMethod,
    workloadType: s.workloadType,
    createHttpRoute: s.createHttpRoute,
    authBridgeEnabled: s.authBridgeEnabled,
    spireEnabled: s.spireEnabled,
  };

  if (s.protocol.trim()) body.protocol = s.protocol.trim();
  if (s.framework.trim()) body.framework = s.framework.trim();

  if (s.deploymentMethod === 'image') {
    body.containerImage = s.containerImage.trim();
    if (s.imagePullSecret.trim())
      body.imagePullSecret = s.imagePullSecret.trim();
  } else {
    body.gitUrl = s.gitUrl.trim();
    if (s.gitBranch.trim()) body.gitBranch = s.gitBranch.trim();
    const normalizedPath = s.gitPath
      .trim()
      .replace(/^\.\/+/, '')
      .replace(/^\.+$/, '');
    if (normalizedPath) body.gitPath = normalizedPath;
    if (s.registryUrl.trim()) body.registryUrl = s.registryUrl.trim();
    if (s.registrySecret.trim()) body.registrySecret = s.registrySecret.trim();
    if (s.imageTag.trim()) body.imageTag = s.imageTag.trim();
    if (s.startCommand.trim()) body.startCommand = s.startCommand.trim();

    const swConfig: KagentiShipwrightConfig = {};
    if (s.buildStrategy.trim()) swConfig.buildStrategy = s.buildStrategy.trim();
    if (s.dockerfile.trim() && s.dockerfile.trim() !== 'Dockerfile') {
      swConfig.dockerfile = s.dockerfile.trim();
    }
    const args = s.buildArgRows.map(r => r.value.trim()).filter(Boolean);
    if (args.length) swConfig.buildArgs = args;
    if (s.buildTimeout.trim() && s.buildTimeout.trim() !== '15m') {
      swConfig.buildTimeout = s.buildTimeout.trim();
    }
    if (Object.keys(swConfig).length) body.shipwrightConfig = swConfig;
  }

  const envVars = buildEnvVars(s.envRows);
  if (envVars) body.envVars = envVars;
  const servicePorts = buildServicePorts(s.portRows);
  if (servicePorts) body.servicePorts = servicePorts;

  return body;
}

export function getDuplicateEnvNames(rows: EnvRow[]): Set<string> {
  const seen = new Map<string, number>();
  for (const r of rows) {
    const n = r.name.trim().toLowerCase();
    if (n) seen.set(n, (seen.get(n) ?? 0) + 1);
  }
  const dupes = new Set<string>();
  for (const [k, v] of seen) {
    if (v > 1) dupes.add(k);
  }
  return dupes;
}

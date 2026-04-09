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
  buildEnvVars,
  buildServicePorts,
  buildToolRequest,
  getDuplicateEnvNames,
  parsePositivePort,
} from './toolWizardUtils';
import type { EnvRow, ToolFormState } from './toolWizardTypes';

function baseState(): ToolFormState {
  return {
    name: 'my-tool',
    namespace: 'team-a',
    description: 'A test tool',
    protocol: 'streamable_http',
    framework: 'Python',
    deploymentMethod: 'image',
    containerImage: 'quay.io/my-tool:v1',
    imagePullSecret: '',
    gitUrl: '',
    gitRevision: 'main',
    contextDir: '.',
    registryUrl: '',
    registrySecret: '',
    imageTag: 'v0.0.1',
    buildStrategy: '',
    dockerfile: 'Dockerfile',
    buildArgRows: [],
    buildTimeout: '15m',
    workloadType: 'deployment',
    persistentStorageEnabled: false,
    persistentStorageSize: '1Gi',
    envRows: [],
    portRows: [],
    createHttpRoute: false,
    authBridgeEnabled: false,
    spireEnabled: false,
  };
}

describe('parsePositivePort', () => {
  it('returns valid port', () => expect(parsePositivePort('8080')).toBe(8080));
  it('rejects 0', () => expect(parsePositivePort('0')).toBeUndefined());
  it('rejects 65536', () => expect(parsePositivePort('65536')).toBeUndefined());
  it('rejects NaN', () => expect(parsePositivePort('abc')).toBeUndefined());
  it('accepts 1', () => expect(parsePositivePort('1')).toBe(1));
  it('accepts 65535', () => expect(parsePositivePort('65535')).toBe(65535));
});

describe('buildEnvVars', () => {
  it('returns undefined for empty rows', () => {
    expect(buildEnvVars([])).toBeUndefined();
  });

  it('builds direct value env vars', () => {
    const rows: EnvRow[] = [
      {
        id: 1,
        name: 'FOO',
        value: 'bar',
        source: 'direct',
        refName: '',
        refKey: '',
      },
    ];
    expect(buildEnvVars(rows)).toEqual([{ name: 'FOO', value: 'bar' }]);
  });

  it('builds secret env var', () => {
    const rows: EnvRow[] = [
      {
        id: 1,
        name: 'DB_PASS',
        value: '',
        source: 'secret',
        refName: 'my-secret',
        refKey: 'password',
      },
    ];
    const result = buildEnvVars(rows);
    expect(result).toEqual([
      {
        name: 'DB_PASS',
        valueFrom: { secretKeyRef: { name: 'my-secret', key: 'password' } },
      },
    ]);
  });

  it('builds configMap env var', () => {
    const rows: EnvRow[] = [
      {
        id: 1,
        name: 'APP_CFG',
        value: '',
        source: 'configMap',
        refName: 'my-cm',
        refKey: 'key1',
      },
    ];
    const result = buildEnvVars(rows);
    expect(result).toEqual([
      {
        name: 'APP_CFG',
        valueFrom: { configMapKeyRef: { name: 'my-cm', key: 'key1' } },
      },
    ]);
  });

  it('skips rows with empty names', () => {
    const rows: EnvRow[] = [
      {
        id: 1,
        name: '',
        value: 'val',
        source: 'direct',
        refName: '',
        refKey: '',
      },
    ];
    expect(buildEnvVars(rows)).toBeUndefined();
  });
});

describe('buildServicePorts', () => {
  it('returns undefined for empty rows', () => {
    expect(buildServicePorts([])).toBeUndefined();
  });

  it('builds valid port', () => {
    const result = buildServicePorts([
      {
        id: 1,
        name: 'http',
        port: '8080',
        targetPort: '8080',
        protocol: 'TCP',
      },
    ]);
    expect(result).toEqual([
      { name: 'http', port: 8080, targetPort: 8080, protocol: 'TCP' },
    ]);
  });

  it('skips invalid ports', () => {
    const result = buildServicePorts([
      { id: 1, name: '', port: 'abc', targetPort: '', protocol: 'TCP' },
    ]);
    expect(result).toBeUndefined();
  });
});

describe('buildToolRequest', () => {
  it('builds minimal image deployment request', () => {
    const result = buildToolRequest(baseState());
    expect(result.name).toBe('my-tool');
    expect(result.namespace).toBe('team-a');
    expect(result.description).toBe('A test tool');
    expect(result.containerImage).toBe('quay.io/my-tool:v1');
    expect(result.deploymentMethod).toBe('image');
    expect(result.protocol).toBe('streamable_http');
    expect(result.framework).toBe('Python');
  });

  it('builds source deployment with shipwright config', () => {
    const state = {
      ...baseState(),
      deploymentMethod: 'source' as const,
      gitUrl: 'https://github.com/org/repo',
      buildStrategy: 'buildpacks-v3',
      buildTimeout: '30m',
    };
    const result = buildToolRequest(state);
    expect(result.gitUrl).toBe('https://github.com/org/repo');
    expect(result.shipwrightConfig).toEqual({
      buildStrategy: 'buildpacks-v3',
      buildTimeout: '30m',
    });
  });

  it('includes buildArgs in shipwright config', () => {
    const state = {
      ...baseState(),
      deploymentMethod: 'source' as const,
      gitUrl: 'https://github.com/org/repo',
      buildArgRows: [
        { id: 1, value: 'ARG1=val1' },
        { id: 2, value: 'ARG2=val2' },
        { id: 3, value: '  ' },
      ],
    };
    const result = buildToolRequest(state);
    expect(result.shipwrightConfig).toEqual({
      buildArgs: ['ARG1=val1', 'ARG2=val2'],
    });
  });

  it('includes persistent storage for statefulset', () => {
    const state = {
      ...baseState(),
      workloadType: 'statefulset' as const,
      persistentStorageEnabled: true,
      persistentStorageSize: '5Gi',
    };
    const result = buildToolRequest(state);
    expect(result.persistentStorage).toEqual({ enabled: true, size: '5Gi' });
  });

  it('omits persistent storage for deployment', () => {
    const state = {
      ...baseState(),
      workloadType: 'deployment' as const,
      persistentStorageEnabled: true,
    };
    const result = buildToolRequest(state);
    expect(result.persistentStorage).toBeUndefined();
  });

  it('includes env vars', () => {
    const state = {
      ...baseState(),
      envRows: [
        {
          id: 1,
          name: 'FOO',
          value: 'bar',
          source: 'direct' as const,
          refName: '',
          refKey: '',
        },
      ],
    };
    const result = buildToolRequest(state);
    expect(result.envVars).toEqual([{ name: 'FOO', value: 'bar' }]);
  });

  it('includes service ports', () => {
    const state = {
      ...baseState(),
      portRows: [
        {
          id: 1,
          name: 'http',
          port: '8080',
          targetPort: '8080',
          protocol: 'TCP' as const,
        },
      ],
    };
    const result = buildToolRequest(state);
    expect(result.servicePorts).toEqual([
      { name: 'http', port: 8080, targetPort: 8080, protocol: 'TCP' },
    ]);
  });
});

describe('getDuplicateEnvNames', () => {
  it('returns empty for no duplicates', () => {
    const rows: EnvRow[] = [
      {
        id: 1,
        name: 'FOO',
        value: '',
        source: 'direct',
        refName: '',
        refKey: '',
      },
      {
        id: 2,
        name: 'BAR',
        value: '',
        source: 'direct',
        refName: '',
        refKey: '',
      },
    ];
    expect(getDuplicateEnvNames(rows).size).toBe(0);
  });

  it('detects duplicates case-insensitively', () => {
    const rows: EnvRow[] = [
      {
        id: 1,
        name: 'FOO',
        value: '',
        source: 'direct',
        refName: '',
        refKey: '',
      },
      {
        id: 2,
        name: 'foo',
        value: '',
        source: 'direct',
        refName: '',
        refKey: '',
      },
    ];
    expect(getDuplicateEnvNames(rows).has('foo')).toBe(true);
  });
});

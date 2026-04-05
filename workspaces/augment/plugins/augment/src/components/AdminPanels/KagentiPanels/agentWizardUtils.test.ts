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

import type { MutableRefObject } from 'react';
import type { EnvRow, FormState, ServicePortRow } from './agentWizardTypes';
import {
  nextRowId,
  buildEnvVars,
  parsePositivePort,
  buildServicePorts,
  buildRequest,
  getDuplicateEnvNames,
} from './agentWizardUtils';

function makeEnvRow(overrides: Partial<EnvRow> & { id: number }): EnvRow {
  return {
    name: '',
    value: '',
    source: 'direct',
    refName: '',
    refKey: '',
    ...overrides,
  };
}

function makePortRow(
  overrides: Partial<ServicePortRow> & { id: number },
): ServicePortRow {
  return {
    name: '',
    port: '',
    targetPort: '',
    protocol: 'TCP',
    ...overrides,
  };
}

function baseFormState(overrides: Partial<FormState> = {}): FormState {
  return {
    name: 'my-agent',
    namespace: 'team-a',
    protocol: 'a2a',
    framework: '',
    deploymentMethod: 'image',
    containerImage: 'quay.io/org/agent:v1',
    imagePullSecret: '',
    gitUrl: '',
    gitBranch: 'main',
    gitPath: '.',
    registryUrl: '',
    registrySecret: '',
    imageTag: '',
    buildStrategy: '',
    startCommand: '',
    dockerfile: 'Dockerfile',
    buildArgRows: [],
    buildTimeout: '15m',
    workloadType: 'deployment',
    envRows: [],
    portRows: [],
    createHttpRoute: false,
    authBridgeEnabled: true,
    spireEnabled: false,
    ...overrides,
  };
}

// -----------------------------------------------------------------------------
// nextRowId
// -----------------------------------------------------------------------------

describe('nextRowId', () => {
  it('increments the ref and returns the new value', () => {
    const ref: MutableRefObject<number> = { current: 0 };
    expect(nextRowId(ref)).toBe(1);
    expect(ref.current).toBe(1);
  });

  it('produces incrementing IDs on sequential calls', () => {
    const ref: MutableRefObject<number> = { current: 5 };
    expect(nextRowId(ref)).toBe(6);
    expect(nextRowId(ref)).toBe(7);
    expect(nextRowId(ref)).toBe(8);
  });
});

// -----------------------------------------------------------------------------
// buildEnvVars
// -----------------------------------------------------------------------------

describe('buildEnvVars', () => {
  it('returns undefined for empty rows', () => {
    expect(buildEnvVars([])).toBeUndefined();
  });

  it('filters out rows with empty name', () => {
    const rows = [makeEnvRow({ id: 1, name: '', value: 'val' })];
    expect(buildEnvVars(rows)).toBeUndefined();
  });

  it('maps direct-value rows', () => {
    const rows = [makeEnvRow({ id: 1, name: ' FOO ', value: ' bar ' })];
    expect(buildEnvVars(rows)).toEqual([{ name: 'FOO', value: 'bar' }]);
  });

  it('maps secret ref rows', () => {
    const rows = [
      makeEnvRow({
        id: 1,
        name: 'DB_PASS',
        source: 'secret',
        refName: 'my-secret',
        refKey: 'password',
      }),
    ];
    expect(buildEnvVars(rows)).toEqual([
      {
        name: 'DB_PASS',
        valueFrom: { secretKeyRef: { name: 'my-secret', key: 'password' } },
      },
    ]);
  });

  it('maps configMap ref rows', () => {
    const rows = [
      makeEnvRow({
        id: 1,
        name: 'CONFIG',
        source: 'configMap',
        refName: 'my-cm',
        refKey: 'setting',
      }),
    ];
    expect(buildEnvVars(rows)).toEqual([
      {
        name: 'CONFIG',
        valueFrom: { configMapKeyRef: { name: 'my-cm', key: 'setting' } },
      },
    ]);
  });

  it('falls through to direct value when ref fields are empty', () => {
    const rows = [
      makeEnvRow({
        id: 1,
        name: 'KEY',
        source: 'secret',
        refName: '',
        refKey: '',
        value: 'fallback',
      }),
    ];
    expect(buildEnvVars(rows)).toEqual([{ name: 'KEY', value: 'fallback' }]);
  });

  it('trims whitespace on all fields', () => {
    const rows = [
      makeEnvRow({
        id: 1,
        name: ' X ',
        source: 'secret',
        refName: ' sec ',
        refKey: ' k ',
      }),
    ];
    expect(buildEnvVars(rows)).toEqual([
      {
        name: 'X',
        valueFrom: { secretKeyRef: { name: 'sec', key: 'k' } },
      },
    ]);
  });
});

// -----------------------------------------------------------------------------
// parsePositivePort
// -----------------------------------------------------------------------------

describe('parsePositivePort', () => {
  it.each([
    ['8080', 8080],
    ['1', 1],
    ['65535', 65535],
    ['8080.9', 8080],
  ])('parses %j as %d', (input, expected) => {
    expect(parsePositivePort(input)).toBe(expected);
  });

  it.each([
    ['empty string', ''],
    ['non-numeric', 'abc'],
    ['zero', '0'],
    ['negative', '-1'],
    ['too large', '65536'],
    ['NaN', 'NaN'],
    ['Infinity', 'Infinity'],
  ])('returns undefined for %s', (_label, input) => {
    expect(parsePositivePort(input)).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// buildServicePorts
// -----------------------------------------------------------------------------

describe('buildServicePorts', () => {
  it('returns undefined for empty rows', () => {
    expect(buildServicePorts([])).toBeUndefined();
  });

  it('skips rows with invalid ports', () => {
    const rows = [makePortRow({ id: 1, port: 'abc' })];
    expect(buildServicePorts(rows)).toBeUndefined();
  });

  it('maps valid rows to KagentiServicePort objects', () => {
    const rows = [
      makePortRow({
        id: 1,
        name: 'http',
        port: '8080',
        targetPort: '8080',
        protocol: 'TCP',
      }),
    ];
    expect(buildServicePorts(rows)).toEqual([
      { port: 8080, protocol: 'TCP', name: 'http', targetPort: 8080 },
    ]);
  });

  it('omits name when empty', () => {
    const rows = [makePortRow({ id: 1, port: '3000' })];
    const result = buildServicePorts(rows)!;
    expect(result[0]).not.toHaveProperty('name');
  });

  it('omits targetPort when invalid', () => {
    const rows = [makePortRow({ id: 1, port: '8080', targetPort: '' })];
    const result = buildServicePorts(rows)!;
    expect(result[0]).not.toHaveProperty('targetPort');
  });

  it('handles multiple rows, filtering invalid ones', () => {
    const rows = [
      makePortRow({ id: 1, name: 'http', port: '8080' }),
      makePortRow({ id: 2, port: 'bad' }),
      makePortRow({ id: 3, name: 'grpc', port: '50051', protocol: 'UDP' }),
    ];
    const result = buildServicePorts(rows)!;
    expect(result).toHaveLength(2);
    expect(result[0].port).toBe(8080);
    expect(result[1].port).toBe(50051);
    expect(result[1].protocol).toBe('UDP');
  });
});

// -----------------------------------------------------------------------------
// buildRequest
// -----------------------------------------------------------------------------

describe('buildRequest', () => {
  it('always includes common fields', () => {
    const result = buildRequest(baseFormState());
    expect(result).toMatchObject({
      name: 'my-agent',
      namespace: 'team-a',
      deploymentMethod: 'image',
      workloadType: 'deployment',
      createHttpRoute: false,
      authBridgeEnabled: true,
      spireEnabled: false,
    });
  });

  it('includes protocol and framework when non-empty', () => {
    const result = buildRequest(
      baseFormState({ protocol: 'mcp', framework: 'CrewAI' }),
    );
    expect(result.protocol).toBe('mcp');
    expect(result.framework).toBe('CrewAI');
  });

  it('omits protocol and framework when empty', () => {
    const result = buildRequest(baseFormState({ protocol: '', framework: '' }));
    expect(result).not.toHaveProperty('protocol');
    expect(result).not.toHaveProperty('framework');
  });

  describe('image deployment', () => {
    it('sets containerImage and imagePullSecret', () => {
      const result = buildRequest(
        baseFormState({
          containerImage: 'quay.io/img:v1',
          imagePullSecret: 'my-secret',
        }),
      );
      expect(result.containerImage).toBe('quay.io/img:v1');
      expect(result.imagePullSecret).toBe('my-secret');
      expect(result).not.toHaveProperty('gitUrl');
    });

    it('omits imagePullSecret when empty', () => {
      const result = buildRequest(baseFormState());
      expect(result).not.toHaveProperty('imagePullSecret');
    });
  });

  describe('source deployment', () => {
    const sourceBase = baseFormState({
      deploymentMethod: 'source',
      containerImage: '',
      gitUrl: 'https://github.com/org/repo',
      gitBranch: 'develop',
      gitPath: 'src',
      registryUrl: 'quay.io/org',
      registrySecret: 'reg-secret',
      imageTag: 'v2',
      startCommand: 'python main.py',
    });

    it('sets source fields and omits containerImage', () => {
      const result = buildRequest(sourceBase);
      expect(result.gitUrl).toBe('https://github.com/org/repo');
      expect(result.gitBranch).toBe('develop');
      expect(result.gitPath).toBe('src');
      expect(result.registryUrl).toBe('quay.io/org');
      expect(result.registrySecret).toBe('reg-secret');
      expect(result.imageTag).toBe('v2');
      expect(result.startCommand).toBe('python main.py');
      expect(result).not.toHaveProperty('containerImage');
    });

    it('builds shipwrightConfig with non-default values', () => {
      const result = buildRequest({
        ...sourceBase,
        buildStrategy: 'kaniko',
        dockerfile: 'docker/Dockerfile.prod',
        buildArgRows: [
          { id: 1, value: 'ARG1=val1' },
          { id: 2, value: '' },
        ],
        buildTimeout: '30m',
      });
      expect(result.shipwrightConfig).toEqual({
        buildStrategy: 'kaniko',
        dockerfile: 'docker/Dockerfile.prod',
        buildArgs: ['ARG1=val1'],
        buildTimeout: '30m',
      });
    });

    it('omits shipwrightConfig when all values are defaults', () => {
      const result = buildRequest({
        ...sourceBase,
        buildStrategy: '',
        dockerfile: 'Dockerfile',
        buildArgRows: [],
        buildTimeout: '15m',
      });
      expect(result).not.toHaveProperty('shipwrightConfig');
    });

    it('omits dockerfile from shipwrightConfig when it equals "Dockerfile"', () => {
      const result = buildRequest({
        ...sourceBase,
        buildStrategy: 'buildah',
        dockerfile: 'Dockerfile',
      });
      expect(result.shipwrightConfig).toEqual({ buildStrategy: 'buildah' });
    });
  });

  it('attaches envVars when present', () => {
    const result = buildRequest(
      baseFormState({
        envRows: [makeEnvRow({ id: 1, name: 'FOO', value: 'bar' })],
      }),
    );
    expect(result.envVars).toEqual([{ name: 'FOO', value: 'bar' }]);
  });

  it('attaches servicePorts when present', () => {
    const result = buildRequest(
      baseFormState({
        portRows: [makePortRow({ id: 1, name: 'http', port: '8080' })],
      }),
    );
    expect(result.servicePorts).toEqual([
      { port: 8080, protocol: 'TCP', name: 'http' },
    ]);
  });

  it('omits envVars and servicePorts when empty', () => {
    const result = buildRequest(baseFormState());
    expect(result).not.toHaveProperty('envVars');
    expect(result).not.toHaveProperty('servicePorts');
  });

  it('trims whitespace from name and namespace', () => {
    const result = buildRequest(
      baseFormState({ name: ' padded ', namespace: ' ns ' }),
    );
    expect(result.name).toBe('padded');
    expect(result.namespace).toBe('ns');
  });
});

// -----------------------------------------------------------------------------
// getDuplicateEnvNames
// -----------------------------------------------------------------------------

describe('getDuplicateEnvNames', () => {
  it('returns empty set when no duplicates', () => {
    const rows = [
      makeEnvRow({ id: 1, name: 'FOO' }),
      makeEnvRow({ id: 2, name: 'BAR' }),
    ];
    expect(getDuplicateEnvNames(rows).size).toBe(0);
  });

  it('detects case-insensitive duplicates', () => {
    const rows = [
      makeEnvRow({ id: 1, name: 'FOO' }),
      makeEnvRow({ id: 2, name: 'foo' }),
    ];
    const dupes = getDuplicateEnvNames(rows);
    expect(dupes.has('foo')).toBe(true);
    expect(dupes.size).toBe(1);
  });

  it('ignores rows with empty names', () => {
    const rows = [
      makeEnvRow({ id: 1, name: '' }),
      makeEnvRow({ id: 2, name: '' }),
    ];
    expect(getDuplicateEnvNames(rows).size).toBe(0);
  });

  it('trims names before comparing', () => {
    const rows = [
      makeEnvRow({ id: 1, name: ' KEY ' }),
      makeEnvRow({ id: 2, name: 'key' }),
    ];
    expect(getDuplicateEnvNames(rows).has('key')).toBe(true);
  });
});

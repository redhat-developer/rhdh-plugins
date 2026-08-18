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

import { renderHook, act, waitFor } from '@testing-library/react';
import type { ApiRef } from '@backstage/core-plugin-api';
import { useApi } from '@backstage/core-plugin-api';
import type { SelectChangeEvent } from '@mui/material/Select';
import { augmentApiRef } from '../../../api';
import { useToolWizardForm } from './useToolWizardForm';
import type { PortProtocol } from './toolWizardTypes';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockedUseApi = jest.mocked(useApi);

type ToolWizardHookResult = ReturnType<typeof useToolWizardForm>;

const sampleStrategy = {
  name: 'kaniko',
  description: 'Kaniko build',
};

// KagentiToolSummary-shaped create response
const createToolResponse = {
  name: 'my-tool',
  namespace: 'team-a',
  description: '',
  status: 'pending',
  labels: {},
};

function createMockApi(overrides = {}) {
  return {
    listKagentiBuildStrategies: jest.fn().mockResolvedValue({
      strategies: [sampleStrategy],
    }),
    listKagentiNamespaces: jest.fn().mockResolvedValue({
      namespaces: ['team-a', 'team-b'],
    }),
    createKagentiTool: jest.fn().mockResolvedValue(createToolResponse),
    ...overrides,
  };
}

function renderForm(
  open: boolean,
  namespaceProp: string | undefined,
  api = createMockApi(),
) {
  const onClose = jest.fn();
  const onCreated = jest.fn();
  mockedUseApi.mockImplementation((ref: ApiRef<unknown>) => {
    if (ref === augmentApiRef) {
      return api;
    }
    return jest.requireActual('@backstage/core-plugin-api').useApi(ref);
  });
  const hook = renderHook(
    ({ o, ns }) => useToolWizardForm(o, ns, onClose, onCreated),
    { initialProps: { o: open, ns: namespaceProp } },
  );
  return { ...hook, onClose, onCreated, api };
}

describe('useToolWizardForm — initialization', () => {
  beforeEach(() => {
    mockedUseApi.mockReset();
  });

  it('has correct default state', () => {
    const { result } = renderForm(false, undefined);
    expect(result.current.activeStep).toBe(0);
    expect(result.current.submitting).toBe(false);
    expect(result.current.submitError).toBeNull();
    expect(result.current.name).toBe('');
    expect(result.current.namespace).toBe('');
    expect(result.current.protocol).toBe('streamable_http');
    expect(result.current.framework).toBe('Python');
    expect(result.current.deploymentMethod).toBe('image');
    expect(result.current.authBridgeEnabled).toBe(false);
    expect(result.current.spireEnabled).toBe(false);
    expect(result.current.createHttpRoute).toBe(false);
    expect(result.current.dockerfile).toBe('Dockerfile');
    expect(result.current.buildTimeout).toBe('15m');
    expect(result.current.gitRevision).toBe('main');
    expect(result.current.contextDir).toBe('');
    expect(result.current.imageTag).toBe('v0.0.1');
  });

  it('uses namespaceProp as initial namespace', () => {
    const { result } = renderForm(false, 'custom-ns');
    expect(result.current.namespace).toBe('custom-ns');
  });

  it('fetches build strategies and namespaces on open', async () => {
    const api = createMockApi();
    const { result, rerender } = renderForm(false, undefined, api);

    expect(api.listKagentiBuildStrategies).not.toHaveBeenCalled();

    rerender({ o: true, ns: undefined });

    await waitFor(() => {
      expect(result.current.buildStrategies).toHaveLength(1);
    });
    expect(result.current.availableNamespaces).toEqual(['team-a', 'team-b']);
    expect(api.listKagentiBuildStrategies).toHaveBeenCalledTimes(1);
    expect(api.listKagentiNamespaces).toHaveBeenCalledTimes(1);
  });

  it('sets buildStrategyError on strategies fetch failure', async () => {
    const api = createMockApi({
      listKagentiBuildStrategies: jest
        .fn()
        .mockRejectedValue(new Error('fail')),
    });
    const { result, rerender } = renderForm(false, undefined, api);

    rerender({ o: true, ns: undefined });

    await waitFor(() => {
      expect(result.current.buildStrategyError).toBe(
        'Failed to load build strategies.',
      );
    });
    expect(result.current.buildStrategies).toEqual([]);
  });

  it('leaves namespaces empty when namespace fetch fails', async () => {
    const api = createMockApi({
      listKagentiNamespaces: jest.fn().mockRejectedValue(new Error('ns')),
    });
    const { result, rerender } = renderForm(false, undefined, api);
    rerender({ o: true, ns: undefined });
    await waitFor(() => {
      expect(api.listKagentiNamespaces).toHaveBeenCalled();
    });
    expect(result.current.availableNamespaces).toEqual([]);
  });
});

describe('useToolWizardForm — validation and navigation', () => {
  beforeEach(() => {
    mockedUseApi.mockReset();
  });

  it('blocks step 0 with empty name', async () => {
    const { result, rerender } = renderForm(false, undefined);
    rerender({ o: true, ns: undefined });

    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(0);
    expect(result.current.submitError).toBe('Name and namespace are required.');
  });

  it('blocks step 0 with invalid DNS name', async () => {
    const { result, rerender } = renderForm(false, 'team-a');
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    act(() => result.current.setName('My Tool'));
    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(0);
    expect(result.current.submitError).toBe(
      'Tool name must be a valid DNS-1123 label.',
    );
  });

  it('advances to step 1 with valid name and namespace', async () => {
    const { result, rerender } = renderForm(false, 'team-a');
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    act(() => result.current.setName('my-tool'));
    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(1);
    expect(result.current.submitError).toBeNull();
  });

  it('blocks step 1 (image) with empty containerImage', async () => {
    const { result, rerender } = renderForm(false, 'team-a');
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    act(() => result.current.setName('my-tool'));
    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(1);

    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(1);
    expect(result.current.submitError).toBe('Container image is required.');
  });

  it('advances to step 2 with valid image', async () => {
    const { result, rerender } = renderForm(false, 'team-a');
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    act(() => result.current.setName('my-tool'));
    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(1);

    act(() => result.current.setContainerImage('quay.io/img:v1'));
    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(2);
  });

  it('handleBack goes back and stays at 0', async () => {
    const { result, rerender } = renderForm(false, 'team-a');
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    act(() => result.current.setName('my-tool'));
    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(1);

    act(() => result.current.handleBack());
    expect(result.current.activeStep).toBe(0);

    act(() => result.current.handleBack());
    expect(result.current.activeStep).toBe(0);
  });

  it('blocks step 1 (source) with empty gitUrl', async () => {
    const { result, rerender } = renderForm(false, 'team-a');
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    act(() => result.current.setName('my-tool'));
    act(() => result.current.setDeploymentMethod('source'));
    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(1);

    act(() => result.current.handleNext());
    expect(result.current.submitError).toBe(
      'Git URL is required for source deployment.',
    );
  });
});

describe('useToolWizardForm — field updates and helpers', () => {
  beforeEach(() => {
    mockedUseApi.mockReset();
  });

  it('updates description, protocol, and framework', () => {
    const { result } = renderForm(false, undefined);
    act(() => {
      result.current.setDescription('A tool');
      result.current.setProtocol('stdio');
      result.current.setFramework('Go');
    });
    expect(result.current.description).toBe('A tool');
    expect(result.current.protocol).toBe('stdio');
    expect(result.current.framework).toBe('Go');
  });

  it('nameError is undefined for empty and valid names', () => {
    const { result } = renderForm(false, undefined);
    expect(result.current.nameError).toBeUndefined();

    act(() => result.current.setName('valid-name'));
    expect(result.current.nameError).toBeUndefined();
  });

  it('nameError returns message for invalid DNS name', () => {
    const { result } = renderForm(false, undefined);
    act(() => result.current.setName('Invalid'));
    expect(result.current.nameError).toContain('Lowercase alphanumeric');
  });

  it('duplicateEnvNames detects case-insensitive duplicates', () => {
    const { result } = renderForm(false, undefined);
    act(() => {
      result.current.addEnvRow();
      result.current.addEnvRow();
    });
    const [row1, row2] = result.current.envRows;
    act(() => {
      result.current.updateEnvRow(row1.id, { name: 'FOO' });
      result.current.updateEnvRow(row2.id, { name: 'foo' });
    });
    expect(result.current.duplicateEnvNames.has('foo')).toBe(true);
  });

  it('addEnvRow / updateEnvRow / removeEnvRow', () => {
    const { result } = renderForm(false, undefined);
    expect(result.current.envRows).toHaveLength(0);

    act(() => result.current.addEnvRow());
    expect(result.current.envRows).toHaveLength(1);
    const id = result.current.envRows[0].id;

    act(() =>
      result.current.updateEnvRow(id, {
        name: 'VAR',
        value: 'x',
        source: 'secret',
        refName: 'sec',
        refKey: 'k',
      }),
    );
    expect(result.current.envRows[0].name).toBe('VAR');
    expect(result.current.envRows[0].source).toBe('secret');

    act(() => result.current.removeEnvRow(id));
    expect(result.current.envRows).toHaveLength(0);
  });

  it('portErrors flags invalid port values', () => {
    const { result } = renderForm(false, undefined);
    act(() => result.current.addPortRow());
    const row = result.current.portRows[0];
    act(() => result.current.updatePortRow(row.id, { port: 'abc' }));
    expect(result.current.portErrors.has(row.id)).toBe(true);
  });

  it('addPortRow / updatePortRow / removePortRow', () => {
    const { result } = renderForm(false, undefined);
    act(() => result.current.addPortRow());
    const id = result.current.portRows[0].id;
    act(() =>
      result.current.updatePortRow(id, {
        name: 'http',
        port: '8080',
        targetPort: '8080',
      }),
    );
    expect(result.current.portRows[0].name).toBe('http');
    act(() => result.current.removePortRow(id));
    expect(result.current.portRows).toHaveLength(0);
  });

  it('handlePortProtocol updates protocol', () => {
    const { result } = renderForm(false, undefined);
    act(() => result.current.addPortRow());
    const id = result.current.portRows[0].id;
    const ev = {
      target: { value: 'UDP' as PortProtocol, name: 'protocol' },
    } as unknown as SelectChangeEvent<PortProtocol>;
    act(() => result.current.handlePortProtocol(id, ev));
    expect(result.current.portRows[0].protocol).toBe('UDP');
  });
});

describe('useToolWizardForm — submit flow', () => {
  beforeEach(() => {
    mockedUseApi.mockReset();
  });

  async function advanceToStep2(result: { current: ToolWizardHookResult }) {
    act(() => {
      result.current.setName('my-tool');
      result.current.setNamespace('team-a');
      result.current.handleNext();
    });
    act(() => {
      result.current.setContainerImage('quay.io/img:v1');
      result.current.handleNext();
    });
  }

  it('calls createKagentiTool on successful submit', async () => {
    const api = createMockApi();
    const { result, rerender, onClose, onCreated } = renderForm(
      false,
      'team-a',
      api,
    );
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    await advanceToStep2(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(api.createKagentiTool).toHaveBeenCalledTimes(1);
    expect(api.createKagentiTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my-tool',
        namespace: 'team-a',
        deploymentMethod: 'image',
        containerImage: 'quay.io/img:v1',
      }),
    );
    expect(result.current.successOpen).toBe(true);
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets submitError on API failure', async () => {
    const api = createMockApi({
      createKagentiTool: jest.fn().mockRejectedValue(new Error('Server error')),
    });
    const { result, rerender, onClose } = renderForm(false, 'team-a', api);
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    await advanceToStep2(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.submitError).toBe('Server error');
    expect(result.current.submitting).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('rejects submit when port errors exist', async () => {
    const api = createMockApi();
    const { result, rerender } = renderForm(false, 'team-a', api);
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    await advanceToStep2(result);

    act(() => {
      result.current.addPortRow();
    });
    const portId = result.current.portRows[0].id;
    act(() => {
      result.current.updatePortRow(portId, { port: 'bad' });
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.submitError).toBe(
      'Fix invalid service port entries before submitting.',
    );
    expect(api.createKagentiTool).not.toHaveBeenCalled();
  });

  it('re-validates step 0 on submit even from step 2', async () => {
    const api = createMockApi();
    const { result, rerender } = renderForm(false, 'team-a', api);
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    await advanceToStep2(result);

    act(() => result.current.setName(''));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.activeStep).toBe(0);
    expect(result.current.submitError).toContain(
      'Name and namespace are required',
    );
    expect(api.createKagentiTool).not.toHaveBeenCalled();
  });

  it('clears submitError via setSubmitError', async () => {
    const { result, rerender } = renderForm(false, 'team-a');
    await act(async () => {
      rerender({ o: true, ns: 'team-a' });
    });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );
    act(() => result.current.setSubmitError('x'));
    expect(result.current.submitError).toBe('x');
    act(() => result.current.setSubmitError(null));
    expect(result.current.submitError).toBeNull();
  });
});

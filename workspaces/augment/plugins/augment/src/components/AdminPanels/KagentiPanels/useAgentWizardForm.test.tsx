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
import { createApiTestWrapper } from '../../../test-utils';
import { useAgentWizardForm } from './useAgentWizardForm';

function createMockApi(overrides: Record<string, unknown> = {}) {
  return {
    listKagentiBuildStrategies: jest.fn().mockResolvedValue({
      strategies: [{ name: 'buildah' }, { name: 'kaniko' }],
    }),
    listKagentiNamespaces: jest.fn().mockResolvedValue({
      namespaces: ['team-a', 'team-b'],
    }),
    createKagentiAgent: jest
      .fn()
      .mockResolvedValue({
        success: true,
        name: 'test-agent',
        namespace: 'team-a',
        message: 'Agent created',
      }),
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
  const wrapper = createApiTestWrapper(api);
  const hook = renderHook(
    ({ o, ns }) => useAgentWizardForm(o, ns, onClose, onCreated),
    { wrapper, initialProps: { o: open, ns: namespaceProp } },
  );
  return { ...hook, onClose, onCreated, api };
}

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------

describe('useAgentWizardForm — initialization', () => {
  it('has correct default state', () => {
    const { result } = renderForm(false, undefined);
    expect(result.current.activeStep).toBe(0);
    expect(result.current.submitting).toBe(false);
    expect(result.current.submitError).toBeNull();
    expect(result.current.name).toBe('');
    expect(result.current.namespace).toBe('');
    expect(result.current.protocol).toBe('a2a');
    expect(result.current.deploymentMethod).toBe('image');
    expect(result.current.authBridgeEnabled).toBe(true);
    expect(result.current.spireEnabled).toBe(false);
    expect(result.current.createHttpRoute).toBe(false);
    expect(result.current.dockerfile).toBe('Dockerfile');
    expect(result.current.buildTimeout).toBe('15m');
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
      expect(result.current.buildStrategies).toHaveLength(2);
    });
    expect(result.current.availableNamespaces).toEqual(['team-a', 'team-b']);
    expect(api.listKagentiBuildStrategies).toHaveBeenCalledTimes(1);
    expect(api.listKagentiNamespaces).toHaveBeenCalledTimes(1);
  });

  it('sets buildStrategyError on fetch failure', async () => {
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
});

// -----------------------------------------------------------------------------
// Validation and navigation
// -----------------------------------------------------------------------------

describe('useAgentWizardForm — validation and navigation', () => {
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

    act(() => result.current.setName('My Agent'));
    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(0);
    expect(result.current.submitError).toBe(
      'Agent name must be a valid DNS-1123 label.',
    );
  });

  it('advances to step 1 with valid name and namespace', async () => {
    const { result, rerender } = renderForm(false, 'team-a');
    rerender({ o: true, ns: 'team-a' });
    await waitFor(() =>
      expect(result.current.availableNamespaces).toHaveLength(2),
    );

    act(() => result.current.setName('my-agent'));
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

    act(() => result.current.setName('my-agent'));
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

    act(() => result.current.setName('my-agent'));
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

    act(() => result.current.setName('my-agent'));
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

    act(() => result.current.setName('my-agent'));
    act(() => result.current.setDeploymentMethod('source'));
    act(() => result.current.handleNext());
    expect(result.current.activeStep).toBe(1);

    act(() => result.current.handleNext());
    expect(result.current.submitError).toBe(
      'Git URL is required for source deployment.',
    );
  });
});

// -----------------------------------------------------------------------------
// Computed values
// -----------------------------------------------------------------------------

describe('useAgentWizardForm — computed values', () => {
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

  it('portErrors flags invalid port values', () => {
    const { result } = renderForm(false, undefined);
    act(() => result.current.addPortRow());
    const row = result.current.portRows[0];
    act(() => result.current.updatePortRow(row.id, { port: 'abc' }));
    expect(result.current.portErrors.has(row.id)).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Row CRUD
// -----------------------------------------------------------------------------

describe('useAgentWizardForm — row CRUD', () => {
  it('addEnvRow / updateEnvRow / removeEnvRow', () => {
    const { result } = renderForm(false, undefined);
    expect(result.current.envRows).toHaveLength(0);

    act(() => result.current.addEnvRow());
    expect(result.current.envRows).toHaveLength(1);
    const id = result.current.envRows[0].id;

    act(() => result.current.updateEnvRow(id, { name: 'CHANGED' }));
    expect(result.current.envRows[0].name).toBe('CHANGED');

    act(() => result.current.removeEnvRow(id));
    expect(result.current.envRows).toHaveLength(0);
  });

  it('addBuildArgRow / updateBuildArgRow / removeBuildArgRow', () => {
    const { result } = renderForm(false, undefined);
    expect(result.current.buildArgRows).toHaveLength(0);

    act(() => result.current.addBuildArgRow());
    expect(result.current.buildArgRows).toHaveLength(1);
    const id = result.current.buildArgRows[0].id;

    act(() => result.current.updateBuildArgRow(id, 'ARG=val'));
    expect(result.current.buildArgRows[0].value).toBe('ARG=val');

    act(() => result.current.removeBuildArgRow(id));
    expect(result.current.buildArgRows).toHaveLength(0);
  });

  it('addPortRow / updatePortRow / removePortRow', () => {
    const { result } = renderForm(false, undefined);
    expect(result.current.portRows).toHaveLength(0);

    act(() => result.current.addPortRow());
    expect(result.current.portRows).toHaveLength(1);
    const id = result.current.portRows[0].id;

    act(() => result.current.updatePortRow(id, { name: 'http', port: '8080' }));
    expect(result.current.portRows[0].name).toBe('http');
    expect(result.current.portRows[0].port).toBe('8080');

    act(() => result.current.removePortRow(id));
    expect(result.current.portRows).toHaveLength(0);
  });
});

// -----------------------------------------------------------------------------
// Submit flow
// -----------------------------------------------------------------------------

describe('useAgentWizardForm — submit flow', () => {
  async function advanceToStep2(result: {
    current: ReturnType<typeof useAgentWizardForm>;
  }) {
    act(() => {
      result.current.setName('my-agent');
      result.current.setNamespace('team-a');
      result.current.handleNext();
    });
    act(() => {
      result.current.setContainerImage('quay.io/img:v1');
      result.current.handleNext();
    });
  }

  it('calls createKagentiAgent on successful submit', async () => {
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

    expect(api.createKagentiAgent).toHaveBeenCalledTimes(1);
    expect(api.createKagentiAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my-agent',
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
      createKagentiAgent: jest
        .fn()
        .mockRejectedValue(new Error('Server error')),
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
    expect(api.createKagentiAgent).not.toHaveBeenCalled();
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
    expect(api.createKagentiAgent).not.toHaveBeenCalled();
  });
});

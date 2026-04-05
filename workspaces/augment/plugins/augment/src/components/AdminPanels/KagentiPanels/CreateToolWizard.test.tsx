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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
// eslint-disable-next-line @backstage/no-undeclared-imports
import { TestApiProvider } from '@backstage/test-utils';
import { augmentApiRef, type AugmentApi } from '../../../api';
import { CreateToolWizard } from './CreateToolWizard';
import type { CreateToolWizardProps } from './toolWizardTypes';

const theme = createTheme();

function createMockApi(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    listKagentiBuildStrategies: jest.fn().mockResolvedValue({
      strategies: [{ name: 'buildah' }],
    }),
    listKagentiNamespaces: jest.fn().mockResolvedValue({
      namespaces: ['team-a', 'team-b'],
    }),
    createKagentiTool: jest.fn().mockResolvedValue({
      success: true,
      name: 'test-tool',
      namespace: 'team-a',
      message: 'Tool created',
    }),
    ...overrides,
  };
}

function renderWizard(
  props: Partial<CreateToolWizardProps> = {},
  apiOverrides: Partial<Record<string, jest.Mock>> = {},
) {
  const onClose = jest.fn();
  const onCreated = jest.fn();
  const api = createMockApi(apiOverrides);
  const result = render(
    <ThemeProvider theme={theme}>
      <TestApiProvider apis={[[augmentApiRef, api as unknown as AugmentApi]]}>
        <CreateToolWizard
          open
          onClose={onClose}
          onCreated={onCreated}
          {...props}
        />
      </TestApiProvider>
    </ThemeProvider>,
  );
  return { ...result, onClose, onCreated, api };
}

function getNameInput(): HTMLElement {
  const inputs = screen.getAllByRole('textbox');
  const nameInput = inputs.find(el => {
    const label = el.closest('.MuiFormControl-root')?.querySelector('label');
    return (
      label?.textContent?.startsWith('Name') &&
      !label?.textContent?.startsWith('Namespace')
    );
  });
  return nameInput ?? inputs[0];
}

describe('CreateToolWizard — rendering', () => {
  it('renders dialog with title and stepper', () => {
    renderWizard();
    expect(screen.getByText('Create Tool')).toBeInTheDocument();
    expect(screen.getByText('Basics')).toBeInTheDocument();
    expect(screen.getByText('Deployment')).toBeInTheDocument();
    expect(screen.getByText('Runtime')).toBeInTheDocument();
  });

  it('shows Cancel and Next buttons on step 0', () => {
    renderWizard();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderWizard({ open: false });
    expect(screen.queryByText('Create Tool')).not.toBeInTheDocument();
  });

  it('loads namespaces from API on open', async () => {
    const { api } = renderWizard();
    await waitFor(() => {
      expect(api.listKagentiNamespaces).toHaveBeenCalled();
    });
  });
});

describe('CreateToolWizard — step navigation', () => {
  it('blocks Next when name is empty', async () => {
    renderWizard();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByText(/Name and namespace are required/i),
    ).toBeInTheDocument();
  });

  it('blocks Next when name is invalid DNS-1123', async () => {
    renderWizard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
    });

    await user.type(getNameInput(), 'INVALID_NAME');

    const nsSelect = screen.getAllByRole('combobox')[0];
    await user.click(nsSelect);
    const option = await screen.findByRole('option', { name: 'team-a' });
    await user.click(option);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/DNS-1123 label/i)).toBeInTheDocument();
  });

  it('navigates to step 1 with valid name and namespace', async () => {
    renderWizard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
    });

    await user.type(getNameInput(), 'my-tool');

    const nsSelect = screen.getAllByRole('combobox')[0];
    await user.click(nsSelect);
    const option = await screen.findByRole('option', { name: 'team-a' });
    await user.click(option);

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Container image')).toBeInTheDocument();
  });

  it('shows Back button on step 1', async () => {
    renderWizard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
    });

    await user.type(getNameInput(), 'my-tool');
    const nsSelect = screen.getAllByRole('combobox')[0];
    await user.click(nsSelect);
    await user.click(await screen.findByRole('option', { name: 'team-a' }));

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });
});

describe('CreateToolWizard — submission', () => {
  it('submits with valid data and calls API', async () => {
    const { api, onCreated, onClose } = renderWizard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
    });

    await user.type(getNameInput(), 'my-tool');
    const nsSelect = screen.getAllByRole('combobox')[0];
    await user.click(nsSelect);
    await user.click(await screen.findByRole('option', { name: 'team-a' }));

    await user.click(screen.getByRole('button', { name: 'Next' }));

    const imageInput = screen.getByRole('textbox', {
      name: /Container image/i,
    });
    await user.type(imageInput, 'quay.io/my-tool:latest');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    const createBtn = screen.getByRole('button', { name: 'Create' });
    await user.click(createBtn);

    await waitFor(() => {
      expect(api.createKagentiTool).toHaveBeenCalledTimes(1);
    });

    const body = api.createKagentiTool.mock.calls[0][0];
    expect(body.name).toBe('my-tool');
    expect(body.namespace).toBe('team-a');
    expect(body.containerImage).toBe('quay.io/my-tool:latest');
    expect(body.deploymentMethod).toBe('image');

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error alert on submission failure', async () => {
    const createKagentiTool = jest
      .fn()
      .mockRejectedValue(new Error('API error'));
    const { api } = renderWizard({}, { createKagentiTool });
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
    });

    await user.type(getNameInput(), 'my-tool');
    const nsSelect = screen.getAllByRole('combobox')[0];
    await user.click(nsSelect);
    await user.click(await screen.findByRole('option', { name: 'team-a' }));

    await user.click(screen.getByRole('button', { name: 'Next' }));

    const imageInput = screen.getByRole('textbox', {
      name: /Container image/i,
    });
    await user.type(imageInput, 'quay.io/my-tool:latest');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(api.createKagentiTool).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/API error/i)).toBeInTheDocument();
    });
  });

  it('blocks step 1 when container image is empty', async () => {
    renderWizard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
    });

    await user.type(getNameInput(), 'my-tool');
    const nsSelect = screen.getAllByRole('combobox')[0];
    await user.click(nsSelect);
    await user.click(await screen.findByRole('option', { name: 'team-a' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByText(/Container image is required/i),
    ).toBeInTheDocument();
  });
});

describe('CreateToolWizard — success snackbar', () => {
  it('shows success snackbar after successful creation', async () => {
    renderWizard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
    });

    await user.type(getNameInput(), 'my-tool');
    const nsSelect = screen.getAllByRole('combobox')[0];
    await user.click(nsSelect);
    await user.click(await screen.findByRole('option', { name: 'team-a' }));

    await user.click(screen.getByRole('button', { name: 'Next' }));

    const imageInput = screen.getByRole('textbox', {
      name: /Container image/i,
    });
    await user.type(imageInput, 'quay.io/my-tool:latest');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(
        screen.getByText('Tool created successfully.'),
      ).toBeInTheDocument();
    });
  });
});

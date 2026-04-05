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

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
// eslint-disable-next-line @backstage/no-undeclared-imports
import { TestApiProvider } from '@backstage/test-utils';
import { augmentApiRef, type AugmentApi } from '../../../api';
import { CreateAgentWizard } from './CreateAgentWizard';
import type { CreateAgentWizardProps } from './agentWizardTypes';

const theme = createTheme();

function createMockApi(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    listKagentiBuildStrategies: jest.fn().mockResolvedValue({
      strategies: [{ name: 'buildah' }],
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

function renderWizard(
  props: Partial<CreateAgentWizardProps> = {},
  apiOverrides: Partial<Record<string, jest.Mock>> = {},
) {
  const onClose = jest.fn();
  const onCreated = jest.fn();
  const api = createMockApi(apiOverrides);
  const result = render(
    <ThemeProvider theme={theme}>
      <TestApiProvider apis={[[augmentApiRef, api as unknown as AugmentApi]]}>
        <CreateAgentWizard
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
    const label = el.closest('.v5-MuiFormControl-root')?.querySelector('label');
    return (
      label?.textContent?.startsWith('Name') &&
      !label?.textContent?.startsWith('Namespace')
    );
  });
  return nameInput ?? inputs[0];
}

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

describe('CreateAgentWizard — rendering', () => {
  it('renders dialog with title and stepper', () => {
    renderWizard();
    expect(screen.getByText('Create Agent')).toBeInTheDocument();
    expect(screen.getByText('Basics')).toBeInTheDocument();
    expect(screen.getByText('Deployment')).toBeInTheDocument();
    expect(screen.getByText('Runtime')).toBeInTheDocument();
  });

  it('shows step 0 fields by default', () => {
    renderWizard();
    expect(getNameInput()).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderWizard({ open: false });
    expect(screen.queryByText('Create Agent')).not.toBeInTheDocument();
  });

  it('shows cancel button', () => {
    renderWizard();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});

// -----------------------------------------------------------------------------
// Step 0 — Basics
// -----------------------------------------------------------------------------

describe('CreateAgentWizard — step 0 basics', () => {
  it('shows error when clicking Next with empty fields', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(
        screen.getByText('Name and namespace are required.'),
      ).toBeInTheDocument();
    });
  });

  it('shows DNS error for invalid name', async () => {
    const user = userEvent.setup();
    renderWizard({ namespace: 'team-a' });

    await user.type(getNameInput(), 'My Agent');
    await user.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(
        screen.getByText('Agent name must be a valid DNS-1123 label.'),
      ).toBeInTheDocument();
    });
  });

  it('advances to step 1 with valid inputs', async () => {
    const user = userEvent.setup();
    renderWizard({ namespace: 'team-a' });

    await user.type(getNameInput(), 'my-agent');
    await user.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Container Image')).toBeInTheDocument();
    });
  });

  it('Cancel button calls onClose', async () => {
    const user = userEvent.setup();
    const { onClose } = renderWizard();

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// -----------------------------------------------------------------------------
// Step 1 — Deployment (image)
// -----------------------------------------------------------------------------

describe('CreateAgentWizard — step 1 image deployment', () => {
  async function goToStep1(user: ReturnType<typeof userEvent.setup>) {
    renderWizard({ namespace: 'team-a' });
    await user.type(getNameInput(), 'my-agent');
    await user.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Container Image')).toBeInTheDocument();
    });
  }

  it('shows image fields by default', async () => {
    const user = userEvent.setup();
    await goToStep1(user);
    expect(screen.getByLabelText(/Container image/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Image pull secret/)).toBeInTheDocument();
  });

  it('blocks Next with empty container image', async () => {
    const user = userEvent.setup();
    await goToStep1(user);

    await user.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(
        screen.getByText('Container image is required.'),
      ).toBeInTheDocument();
    });
  });

  it('advances to step 2 with valid image', async () => {
    const user = userEvent.setup();
    await goToStep1(user);

    await user.type(screen.getByLabelText(/Container image/), 'quay.io/img:v1');
    await user.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Auth bridge enabled')).toBeInTheDocument();
    });
  });
});

// -----------------------------------------------------------------------------
// Step 1 — Deployment (source)
// -----------------------------------------------------------------------------

describe('CreateAgentWizard — step 1 source deployment', () => {
  it('shows source fields when Source from Git is selected', async () => {
    const user = userEvent.setup();
    renderWizard({ namespace: 'team-a' });
    await user.type(getNameInput(), 'my-agent');
    await user.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Container Image')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Source from Git'));

    await waitFor(() => {
      expect(screen.getByLabelText(/Git URL/)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/Container image/)).not.toBeInTheDocument();
    expect(screen.getByText('Build configuration')).toBeInTheDocument();
  });
});

// -----------------------------------------------------------------------------
// Step 2 — Runtime
// -----------------------------------------------------------------------------

describe('CreateAgentWizard — step 2 runtime', () => {
  async function goToStep2(user: ReturnType<typeof userEvent.setup>) {
    renderWizard({ namespace: 'team-a' });
    await user.type(getNameInput(), 'my-agent');
    await user.click(screen.getByText('Next'));
    await waitFor(() =>
      expect(screen.getByLabelText(/Container image/)).toBeInTheDocument(),
    );
    await user.type(screen.getByLabelText(/Container image/), 'quay.io/img:v1');
    await user.click(screen.getByText('Next'));
    await waitFor(() =>
      expect(screen.getByText('Auth bridge enabled')).toBeInTheDocument(),
    );
  }

  it('shows workload type options', async () => {
    const user = userEvent.setup();
    await goToStep2(user);
    expect(screen.getByLabelText('Deployment')).toBeInTheDocument();
    expect(screen.getByLabelText('StatefulSet')).toBeInTheDocument();
    expect(screen.getByLabelText('Job')).toBeInTheDocument();
  });

  it('auth bridge is enabled by default', async () => {
    const user = userEvent.setup();
    await goToStep2(user);
    const switchEl = within(
      screen.getByText('Auth bridge enabled').closest('label')!,
    ).getByRole('checkbox');
    expect(switchEl).toBeChecked();
  });

  it('SPIRE is disabled by default', async () => {
    const user = userEvent.setup();
    await goToStep2(user);
    const switchEl = within(
      screen.getByText('SPIRE enabled').closest('label')!,
    ).getByRole('checkbox');
    expect(switchEl).not.toBeChecked();
  });

  it('shows Import button instead of Next', async () => {
    const user = userEvent.setup();
    await goToStep2(user);
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('shows Back button', async () => {
    const user = userEvent.setup();
    await goToStep2(user);
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('Back button returns to step 1', async () => {
    const user = userEvent.setup();
    await goToStep2(user);

    await user.click(screen.getByText('Back'));
    await waitFor(() => {
      expect(screen.getByLabelText(/Container image/)).toBeInTheDocument();
    });
  });

  it('adds env var row on button click', async () => {
    const user = userEvent.setup();
    await goToStep2(user);

    await user.click(screen.getByText('Add variable'));
    await waitFor(() => {
      expect(screen.getByLabelText('Value')).toBeInTheDocument();
    });
  });

  it('adds port row on button click', async () => {
    const user = userEvent.setup();
    await goToStep2(user);

    await user.click(screen.getByText('Add port'));
    await waitFor(() => {
      expect(screen.getByLabelText(/^Port$/)).toBeInTheDocument();
    });
  });
});

// -----------------------------------------------------------------------------
// End-to-end creation (image)
// -----------------------------------------------------------------------------

describe('CreateAgentWizard — e2e image creation', () => {
  it('creates agent with correct payload', async () => {
    const user = userEvent.setup();
    const { api, onClose, onCreated } = renderWizard({ namespace: 'team-a' });

    await user.type(getNameInput(), 'my-agent');
    await user.click(screen.getByText('Next'));
    await waitFor(() =>
      expect(screen.getByLabelText(/Container image/)).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText(/Container image/), 'quay.io/img:v1');
    await user.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Import')).toBeInTheDocument());

    await user.click(screen.getByText('Import'));

    await waitFor(() => {
      expect(api.createKagentiAgent).toHaveBeenCalledTimes(1);
    });
    expect(api.createKagentiAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my-agent',
        namespace: 'team-a',
        deploymentMethod: 'image',
        containerImage: 'quay.io/img:v1',
        authBridgeEnabled: true,
        spireEnabled: false,
      }),
    );
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(
        screen.getByText('Agent created successfully.'),
      ).toBeInTheDocument();
    });
  });
});

// -----------------------------------------------------------------------------
// End-to-end creation (source)
// -----------------------------------------------------------------------------

describe('CreateAgentWizard — e2e source creation', () => {
  it('creates agent with source deployment payload', async () => {
    const user = userEvent.setup();
    const { api } = renderWizard({ namespace: 'team-a' });

    await user.type(getNameInput(), 'src-agent');
    await user.click(screen.getByText('Next'));
    await waitFor(() =>
      expect(screen.getByText('Container Image')).toBeInTheDocument(),
    );

    await user.click(screen.getByLabelText('Source from Git'));
    await waitFor(() =>
      expect(screen.getByLabelText(/Git URL/)).toBeInTheDocument(),
    );

    await user.type(
      screen.getByLabelText(/Git URL/),
      'https://github.com/org/repo',
    );
    await user.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Import')).toBeInTheDocument());

    await user.click(screen.getByText('Import'));

    await waitFor(() => {
      expect(api.createKagentiAgent).toHaveBeenCalledTimes(1);
    });
    expect(api.createKagentiAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'src-agent',
        deploymentMethod: 'source',
        gitUrl: 'https://github.com/org/repo',
      }),
    );
  });
});

// -----------------------------------------------------------------------------
// Error handling
// -----------------------------------------------------------------------------

describe('CreateAgentWizard — error handling', () => {
  it('shows error alert when createKagentiAgent rejects', async () => {
    const user = userEvent.setup();
    const { onClose } = renderWizard(
      { namespace: 'team-a' },
      {
        createKagentiAgent: jest.fn().mockRejectedValue(new Error('Conflict')),
      },
    );

    await user.type(getNameInput(), 'my-agent');
    await user.click(screen.getByText('Next'));
    await waitFor(() =>
      expect(screen.getByLabelText(/Container image/)).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText(/Container image/), 'quay.io/img:v1');
    await user.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Import')).toBeInTheDocument());

    await user.click(screen.getByText('Import'));

    await waitFor(() => {
      expect(screen.getByText('Conflict')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

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

import { mockUseTranslation } from '../test-utils/mockTranslations';

const mockRulesGet = jest.fn();

jest.mock('../ClientService', () => ({
  useClientService: () => ({ rulesGet: mockRulesGet }),
}));

jest.mock('../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { RulesAcceptance } from './RulesAcceptance';
import type { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';
import type { Rule } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

const PREVIEW_LIMIT = 100;

// 200+ chars so it is forced past the checklist preview limit.
const LONG_DESCRIPTION =
  'This is a very long organizational rule description that goes well beyond one hundred characters, ' +
  'so the checklist must truncate the preview and rely on the Read more dialog to show the full text.';

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule-1',
    title: 'Rule One',
    description: LONG_DESCRIPTION,
    required: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as Rule;
}

function mockRules(items: Rule[]) {
  mockRulesGet.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ items }),
  });
}

function makeProps(
  overrides: Partial<FieldExtensionComponentProps<string>> = {},
): FieldExtensionComponentProps<string> {
  return {
    onChange: jest.fn(),
    onBlur: jest.fn(),
    onFocus: jest.fn(),
    rawErrors: [],
    required: false,
    disabled: false,
    readonly: false,
    schema: { title: 'Project rules', description: 'Accept the rules' },
    uiSchema: {},
    formContext: { formData: {} },
    formData: undefined,
    name: 'acceptedRuleIds',
    idSchema: { $id: 'root_acceptedRuleIds' },
    registry: {},
    ...overrides,
  } as unknown as FieldExtensionComponentProps<string>;
}

async function renderComponent(
  overrides: Partial<FieldExtensionComponentProps<string>> = {},
) {
  const props = makeProps(overrides);
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <ThemeProvider theme={createTheme()}>
        <RulesAcceptance {...props} />
      </ThemeProvider>,
    );
  });
  return result;
}

describe('RulesAcceptance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('truncates a long description to a preview in the checklist', async () => {
    mockRules([makeRule()]);
    const { container } = await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Rule One')).toBeInTheDocument();
    });

    const preview = `${LONG_DESCRIPTION.slice(0, PREVIEW_LIMIT)}...`;
    // The checklist shows only the truncated preview, not the full text.
    expect(container.textContent).toContain(preview);
    expect(container.textContent).not.toContain(LONG_DESCRIPTION);
    expect(screen.getByText('Read more')).toBeInTheDocument();
  });

  it('shows the full description in a dialog when Read more is clicked', async () => {
    mockRules([makeRule()]);
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Read more')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Read more'));
    });

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Rule One')).toBeInTheDocument();
    // The full, untruncated description is now readable.
    expect(within(dialog).getByText(LONG_DESCRIPTION)).toBeInTheDocument();
  });

  it('closes the dialog when Close is clicked', async () => {
    mockRules([makeRule()]);
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Read more')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Read more'));
    });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByText('Close'));
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('does not render Read more for short descriptions', async () => {
    mockRules([makeRule({ description: 'A short rule.' })]);
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('A short rule.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Read more')).not.toBeInTheDocument();
  });

  it('does not toggle the checkbox when Read more is clicked', async () => {
    mockRules([makeRule()]);
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Read more')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await act(async () => {
      await userEvent.click(screen.getByText('Read more'));
    });

    // Opening the dialog must not accept/toggle the rule.
    expect(checkbox).not.toBeChecked();
  });
});

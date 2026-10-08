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

import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentFormFields, AgentFormFieldsProps } from './AgentFormFields';
import { emptyAgentForm, AgentForm } from '../agentFormTypes';

jest.mock('../../../hooks/useTranslation', () => {
  const mod = require('../../../test-utils/mockTranslations');
  return { useTranslation: mod.mockUseTranslation };
});

type TouchedMap = Partial<Record<keyof AgentForm, boolean>>;

function Wrapper(
  props: Readonly<
    Pick<
      AgentFormFieldsProps,
      'serviceTypes' | 'loadingServiceTypes' | 'loadingMoreServiceTypes'
    >
  >,
) {
  const [form, setForm] = useState(emptyAgentForm());
  const [touched, setTouched] = useState<TouchedMap>({});
  return (
    <AgentFormFields
      form={form}
      setForm={setForm}
      touched={touched}
      setTouched={setTouched}
      serviceTypes={props.serviceTypes ?? []}
      loadingServiceTypes={props.loadingServiceTypes ?? false}
      loadingMoreServiceTypes={props.loadingMoreServiceTypes ?? false}
    />
  );
}

const NAME_PLACEHOLDER = 'e.g. env-agent-west-1';
const ENV_PLACEHOLDER = 'e.g. production';
const TOPIC_PLACEHOLDER = 'e.g. dcm.agent.env-agent-west-1';

describe('AgentFormFields', () => {
  it('renders all form fields', () => {
    render(<Wrapper />);

    expect(screen.getByPlaceholderText(NAME_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(ENV_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(TOPIC_PLACEHOLDER)).toBeInTheDocument();
    // Service types and Cost selects exist via their label text
    expect(screen.getAllByText(/service types \*/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cost \*/i).length).toBeGreaterThan(0);
  });

  it('Name field updates its value when the user types', async () => {
    render(<Wrapper />);
    const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER);
    await userEvent.type(nameInput, 'my-agent');
    expect(nameInput).toHaveValue('my-agent');
  });

  it('shows a validation error after blurring Name with an invalid value', async () => {
    render(<Wrapper />);
    const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER);
    await userEvent.type(nameInput, 'INVALID NAME');
    fireEvent.blur(nameInput);
    expect(
      screen.getByText(
        /only lowercase letters, numbers, and hyphens are allowed/i,
      ),
    ).toBeInTheDocument();
  });

  it('does not show a validation error for a valid Name slug', async () => {
    render(<Wrapper />);
    const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER);
    await userEvent.type(nameInput, 'env-agent-west-1');
    fireEvent.blur(nameInput);
    expect(
      screen.queryByText(
        /only lowercase letters, numbers, and hyphens are allowed/i,
      ),
    ).not.toBeInTheDocument();
  });

  it('shows the helper text for the Name field', () => {
    render(<Wrapper />);
    expect(
      screen.getByText(/unique slug identifier.*only lowercase letters/i),
    ).toBeInTheDocument();
  });

  describe('service types dropdown', () => {
    it('shows "Service types this agent can provide" placeholder when list is empty', () => {
      render(<Wrapper serviceTypes={[]} />);
      // Helper text under the field
      expect(
        screen.getAllByText(/service types this agent can provide/i).length,
      ).toBeGreaterThan(0);
    });

    it('renders provided service type options when the dropdown is opened', async () => {
      const serviceTypes = [
        { uid: '1', service_type: 'vm', api_version: 'v1', spec: {} },
        { uid: '2', service_type: 'container', api_version: 'v1', spec: {} },
      ];
      render(<Wrapper serviceTypes={serviceTypes} />);

      fireEvent.mouseDown(
        screen.getByRole('button', { name: /service types/i }),
      );

      expect(await screen.findByText('vm')).toBeInTheDocument();
      expect(await screen.findByText('container')).toBeInTheDocument();
    });
  });

  describe('topic_name auto-fill', () => {
    it('auto-fills topic_name with dcm.agent.<name> as the user types the name', async () => {
      render(<Wrapper />);
      const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER);
      const topicInput = screen.getByPlaceholderText(TOPIC_PLACEHOLDER);

      await userEvent.type(nameInput, 'my-agent');

      expect(topicInput).toHaveValue('dcm.agent.my-agent');
    });

    it('stops auto-filling topic_name once the user manually edits it', async () => {
      render(<Wrapper />);
      const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER);
      const topicInput = screen.getByPlaceholderText(TOPIC_PLACEHOLDER);

      // Type a name first so auto-fill has fired
      await userEvent.type(nameInput, 'my-agent');
      expect(topicInput).toHaveValue('dcm.agent.my-agent');

      // Manually edit the topic
      await userEvent.clear(topicInput);
      await userEvent.type(topicInput, 'dcm.agent.custom');

      // Now change the name again
      await userEvent.type(nameInput, '-extra');

      // topic_name should remain at the manually edited value
      expect(topicInput).toHaveValue('dcm.agent.custom');
    });

    it('resumes auto-filling after the form is reset to empty (simulates dialog close + reopen)', async () => {
      // The Wrapper re-initialises form state via useState(emptyAgentForm()),
      // so remounting it simulates what happens when useCrudTab resets createForm.
      const { unmount } = render(<Wrapper />);
      unmount();
      render(<Wrapper />);

      const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER);
      const topicInput = screen.getByPlaceholderText(TOPIC_PLACEHOLDER);

      await userEvent.type(nameInput, 'new-agent');

      // topic_name must auto-fill on a fresh form instance
      expect(topicInput).toHaveValue('dcm.agent.new-agent');
    });
  });
});

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

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useSkills } from '../../hooks/useSkills';
import { mockT, mockUseTranslation } from '../../test-utils/mockTranslations';
import { SkillsMessageBar } from '../SkillsMessageBar';

jest.mock('../../hooks/useSkills');
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const mockUseSkills = useSkills as jest.MockedFunction<typeof useSkills>;
const skills = [
  { name: 'web_search', description: 'Search the web for information' },
  { name: 'code_interpreter', description: 'Execute and interpret code' },
  { name: 'summarize', description: 'Summarize documents or conversations' },
];
const readyState = { skills, loading: false, error: null, denied: false };

function setup(initialValue = '') {
  const onSendMessage = jest.fn();
  const user = userEvent.setup();
  function ControlledInput() {
    const [value, setValue] = useState(initialValue);
    return (
      <SkillsMessageBar
        value={value}
        onChange={setValue}
        onSendMessage={message => {
          onSendMessage(message);
          setValue('');
        }}
        hasAttachButton={false}
      />
    );
  }
  const result = render(<ControlledInput />);
  const input = screen.getByRole('combobox') as HTMLTextAreaElement;
  return { ...result, input, user, onSendMessage };
}

const getSkill = (name: string) =>
  within(screen.getByRole('listbox')).getByText(`/${name}`);

describe('SkillsMessageBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSkills.mockReturnValue(readyState);
  });

  it('lists available skill names and descriptions after a slash', async () => {
    const { input, user } = setup();
    expect(mockUseSkills).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.type(input, '/');

    expect(mockUseSkills).toHaveBeenLastCalledWith(true);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('listbox', { name: 'Skills' });
    expect(input).toHaveAttribute('aria-controls', list.id);
    for (const skill of skills) {
      expect(within(list).getByText(`/${skill.name}`)).toBeVisible();
      expect(within(list).getByText(skill.description)).toBeVisible();
    }
  });

  it.each(['SUM', 'DOCUMENTS'])(
    'filters case-insensitively by name or description for /%s',
    async search => {
      const { input, user } = setup();
      await user.type(input, `/${search}`);

      expect(getSkill('summarize')).toBeVisible();
      expect(screen.queryByText('/web_search')).not.toBeInTheDocument();
      expect(screen.queryByText('/code_interpreter')).not.toBeInTheDocument();
    },
  );

  it('inserts a pointer-selected skill without losing context on either side', async () => {
    const { input, user, onSendMessage } = setup('Please  this document');
    await user.type(input, '/su', {
      initialSelectionStart: 7,
      initialSelectionEnd: 7,
    });
    await user.click(getSkill('summarize'));

    expect(input).toHaveValue('Please /summarize this document');
    expect(input).toHaveFocus();
    await waitFor(() => {
      expect(input.selectionStart).toBe('Please /summarize'.length);
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onSendMessage).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSendMessage).toHaveBeenCalledWith(
      'Please /summarize this document',
    );
  });

  it('selects with arrows and Enter while retaining surrounding text', async () => {
    const { input, user, onSendMessage } = setup('Please  now');
    await user.type(input, '/', {
      initialSelectionStart: 7,
      initialSelectionEnd: 7,
    });
    const firstActiveId = input.getAttribute('aria-activedescendant');
    expect(document.getElementById(firstActiveId!)).toHaveTextContent(
      '/web_search',
    );

    await user.keyboard('{ArrowDown}');
    const secondActiveId = input.getAttribute('aria-activedescendant');
    expect(secondActiveId).not.toBe(firstActiveId);
    expect(document.getElementById(secondActiveId!)).toHaveTextContent(
      '/code_interpreter',
    );
    expect(input).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(input).toHaveValue('Please /code_interpreter now');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('wraps backward through the skills using ArrowUp', async () => {
    const { input, user } = setup();
    await user.type(input, '/');
    await user.keyboard('{ArrowUp}{Enter}');
    expect(input).toHaveValue('/summarize ');
  });

  it('retains earlier skills and context when inserting another skill', async () => {
    const { input, user } = setup();
    await user.type(input, 'hi /su');
    await user.keyboard('{Enter}');
    await user.type(input, 'hello /co');
    await user.click(getSkill('code_interpreter'));

    expect(input).toHaveValue('hi /summarize hello /code_interpreter ');
  });

  it('shows a no-match state and leaves the input editable and sendable', async () => {
    const { input, user, onSendMessage } = setup();
    await user.type(input, '/unavailable');

    expect(screen.getByRole('status')).toHaveTextContent(
      mockT('skills.noMatch'),
    );
    expect(input).toHaveValue('/unavailable');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    await user.keyboard('{Enter}');
    expect(onSendMessage).toHaveBeenCalledWith('/unavailable');
  });

  it.each([
    ['empty catalog', { skills: [] }, 'skills.empty'],
    ['loading catalog', { skills: [], loading: true }, 'skills.loading'],
    [
      'catalog failure',
      { skills: [], error: new Error('Unavailable') },
      'skills.error',
    ],
    [
      'permission denied',
      { skills: [], denied: true },
      'skills.permissionDenied',
    ],
  ] as const)(
    'displays %s without blocking normal chat',
    async (_label, state, key) => {
      mockUseSkills.mockReturnValue({ ...readyState, ...state, skills: [] });
      const { input, user, onSendMessage } = setup();
      await user.type(input, '/');

      expect(screen.getByRole('status')).toHaveTextContent(mockT(key));
      expect(input).not.toBeDisabled();
      await user.type(input, 'ordinary chat');
      await user.keyboard('{Enter}');
      expect(onSendMessage).toHaveBeenCalledWith('/ordinary chat');
    },
  );

  it.each([
    ['matching skills', readyState],
    ['empty catalog', { ...readyState, skills: [] }],
    [
      'catalog failure',
      { ...readyState, skills: [], error: new Error('Unavailable') },
    ],
    ['permission denied', { ...readyState, skills: [], denied: true }],
  ])(
    'dismisses %s with Escape without modifying the draft',
    async (_label, state) => {
      mockUseSkills.mockReturnValue(state as ReturnType<typeof useSkills>);
      const { input, user, onSendMessage } = setup();
      await user.type(input, '/');
      await user.keyboard('{Escape}');
      expect(input).toHaveAttribute('aria-expanded', 'false');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
      expect(input).toHaveValue('/');
      expect(input).toHaveFocus();
      expect(onSendMessage).not.toHaveBeenCalled();
    },
  );

  it('preserves Shift+Enter for a newline and Enter for normal chat', async () => {
    const { input, user, onSendMessage } = setup();
    await user.type(input, '/su');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(input).toHaveValue('/su\n');
    expect(onSendMessage).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.type(input, 'context');
    await user.keyboard('{Enter}');
    expect(onSendMessage).toHaveBeenCalledWith('/su\ncontext');
  });

  it('does not open the typeahead for slashes within URLs', async () => {
    const { input, user } = setup();
    await user.type(input, 'See https://example.com/docs');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('See https://example.com/docs');
  });

  it('keeps composition Enter from inserting or sending a skill', async () => {
    const { input, user, onSendMessage } = setup();
    await user.type(input, '/su');
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
    fireEvent.compositionEnd(input);

    expect(input).toHaveValue('/su');
    expect(onSendMessage).not.toHaveBeenCalled();
    expect(getSkill('summarize')).toBeVisible();
  });

  it('replaces the complete slash token when the caret is inside it', async () => {
    const { input, user } = setup(' this document');
    await user.type(input, 'Please /summarize', {
      initialSelectionStart: 0,
      initialSelectionEnd: 0,
    });
    input.setSelectionRange('Please /sum'.length, 'Please /sum'.length);
    fireEvent.select(input);
    await user.click(getSkill('summarize'));

    expect(input).toHaveValue('Please /summarize this document');
    await waitFor(() => {
      expect(input.selectionStart).toBe('Please /summarize'.length);
    });
  });

  it('dismisses matches when the caret moves before the slash', async () => {
    const { input, user } = setup();
    await user.type(input, 'Please /su');
    input.setSelectionRange(0, 0);
    fireEvent.select(input);

    expect(input).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(input).toHaveValue('Please /su');
  });

  it('dismisses matches on an outside click without changing the draft', async () => {
    const { input, user } = setup();
    await user.type(input, '/su');
    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(input).toHaveValue('/su');
  });

  it('closes the typeahead when focus is moved away with Tab', async () => {
    const { input, user } = setup();
    await user.type(input, '/');
    await user.tab();
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(input).toHaveValue('/');
  });
});

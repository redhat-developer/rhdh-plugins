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

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerticalTabDialog } from './VerticalTabDialog';

jest.mock('../hooks/useTranslation', () => {
  const mod = require('../test-utils/mockTranslations');
  return { useTranslation: mod.mockUseTranslation };
});

const TWO_TABS = [
  { label: 'First', content: <div>First content</div> },
  { label: 'Second', content: <div>Second content</div> },
];

const THREE_TABS = [
  { label: 'Step 1', content: <div>Step 1 content</div> },
  { label: 'Step 2', content: <div>Step 2 content</div> },
  { label: 'Step 3', content: <div>Step 3 content</div> },
];

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof VerticalTabDialog>> = {},
) {
  const defaults: React.ComponentProps<typeof VerticalTabDialog> = {
    open: true,
    onClose: jest.fn(),
    title: 'Test Wizard',
    tabs: TWO_TABS,
    activeTab: 0,
    onTabChange: jest.fn(),
    submitLabel: 'Save',
    onSubmit: jest.fn(),
  };
  return render(<VerticalTabDialog {...defaults} {...overrides} />);
}

describe('VerticalTabDialog', () => {
  it('renders the dialog title and tab labels', () => {
    renderDialog({ tabs: THREE_TABS });
    expect(screen.getByText('Test Wizard')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Step 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Step 2' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Step 3' })).toBeInTheDocument();
  });

  it('renders the active tab content', () => {
    renderDialog({ tabs: THREE_TABS, activeTab: 1 });
    expect(screen.getByText('Step 2 content')).toBeInTheDocument();
    expect(screen.queryByText('Step 1 content')).not.toBeInTheDocument();
  });

  it('shows the Next button on non-last tabs and Submit on the last tab', () => {
    renderDialog({ tabs: THREE_TABS, activeTab: 0 });
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
  });

  it('shows the Submit button on the last tab', () => {
    renderDialog({ tabs: THREE_TABS, activeTab: 2 });
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /next/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onTabChange(activeTab + 1) when Next is clicked without onBeforeNext', () => {
    const onTabChange = jest.fn();
    renderDialog({ tabs: THREE_TABS, activeTab: 1, onTabChange });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onTabChange).toHaveBeenCalledWith(2);
  });

  it('advances when onBeforeNext returns true', () => {
    const onTabChange = jest.fn();
    const onBeforeNext = jest.fn().mockReturnValue(true);
    renderDialog({ tabs: THREE_TABS, activeTab: 0, onTabChange, onBeforeNext });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onBeforeNext).toHaveBeenCalledWith(0);
    expect(onTabChange).toHaveBeenCalledWith(1);
  });

  it('blocks advance when onBeforeNext returns false', () => {
    const onTabChange = jest.fn();
    const onBeforeNext = jest.fn().mockReturnValue(false);
    renderDialog({ tabs: THREE_TABS, activeTab: 0, onTabChange, onBeforeNext });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onBeforeNext).toHaveBeenCalledWith(0);
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('disables the Back button on the first tab', () => {
    renderDialog({ tabs: THREE_TABS, activeTab: 0 });
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });

  it('calls onTabChange(activeTab - 1) when Back is clicked', () => {
    const onTabChange = jest.fn();
    renderDialog({ tabs: THREE_TABS, activeTab: 2, onTabChange });
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onTabChange).toHaveBeenCalledWith(1);
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = jest.fn();
    renderDialog({ onClose });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the close icon is clicked', async () => {
    const onClose = jest.fn();
    renderDialog({ onClose });
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSubmit when Submit is clicked on the last tab', () => {
    const onSubmit = jest.fn();
    renderDialog({ tabs: TWO_TABS, activeTab: 1, onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('disables Cancel, Submit, and Back when submitting', () => {
    renderDialog({ tabs: TWO_TABS, activeTab: 1, submitting: true });
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });

  it('disables the Submit button when disabled prop is true', () => {
    renderDialog({ tabs: TWO_TABS, activeTab: 1, disabled: true });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('shows the error banner when error prop is set', () => {
    renderDialog({ error: 'Something went wrong' });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not show the error banner when error is falsy', () => {
    renderDialog({ error: null });
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('uses tab.key when provided to avoid duplicate-label collisions', () => {
    const tabs = [
      { key: 'tab-a', label: 'Resource', content: <div>A</div> },
      { key: 'tab-b', label: 'Resource', content: <div>B</div> },
    ];
    // Both tabs have the same label but different keys — should render without crashing.
    renderDialog({ tabs });
    expect(screen.getAllByRole('tab', { name: 'Resource' })).toHaveLength(2);
  });
});

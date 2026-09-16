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
import { act, renderHook } from '@testing-library/react';

import { useSavedPromptActions } from '../useSavedPromptActions';

const mockPrompt = {
  id: 'sp-1',
  name: 'Test prompt',
  content: 'Hello world',
  created_at: '2026-03-10T12:00:00Z',
  updated_at: '2026-03-10T12:00:00Z',
};

describe('useSavedPromptActions', () => {
  it('should call onApplyToInput when applyToInput is invoked', () => {
    const onApplyToInput = jest.fn();
    const onSendDirectly = jest.fn();
    const onDelete = jest.fn();

    const { result } = renderHook(() =>
      useSavedPromptActions({
        onApplyToInput,
        onSendDirectly,
        onDelete,
      }),
    );

    act(() => {
      result.current.applyToInput('prompt text');
    });

    expect(onApplyToInput).toHaveBeenCalledWith('prompt text');
  });

  it('should call onSendDirectly when sendDirectly is invoked', () => {
    const onApplyToInput = jest.fn();
    const onSendDirectly = jest.fn();
    const onDelete = jest.fn();

    const { result } = renderHook(() =>
      useSavedPromptActions({
        onApplyToInput,
        onSendDirectly,
        onDelete,
      }),
    );

    act(() => {
      result.current.sendDirectly('prompt text');
    });

    expect(onSendDirectly).toHaveBeenCalledWith('prompt text');
  });

  it('should open delete modal when requestDelete is called', () => {
    const { result } = renderHook(() =>
      useSavedPromptActions({
        onApplyToInput: jest.fn(),
        onSendDirectly: jest.fn(),
        onDelete: jest.fn(),
      }),
    );

    act(() => {
      result.current.requestDelete(mockPrompt);
    });

    expect(result.current.isDeleteModalOpen).toBe(true);
    expect(result.current.promptToDelete).toEqual(mockPrompt);
  });

  it('should close delete modal on closeDeleteModal', () => {
    const { result } = renderHook(() =>
      useSavedPromptActions({
        onApplyToInput: jest.fn(),
        onSendDirectly: jest.fn(),
        onDelete: jest.fn(),
      }),
    );

    act(() => {
      result.current.requestDelete(mockPrompt);
    });
    act(() => {
      result.current.closeDeleteModal();
    });

    expect(result.current.isDeleteModalOpen).toBe(false);
    expect(result.current.promptToDelete).toBeNull();
  });

  it('should call onDelete and close modal on confirmDelete', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useSavedPromptActions({
        onApplyToInput: jest.fn(),
        onSendDirectly: jest.fn(),
        onDelete,
      }),
    );

    act(() => {
      result.current.requestDelete(mockPrompt);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(onDelete).toHaveBeenCalledWith('sp-1');
    expect(result.current.isDeleteModalOpen).toBe(false);
  });
});

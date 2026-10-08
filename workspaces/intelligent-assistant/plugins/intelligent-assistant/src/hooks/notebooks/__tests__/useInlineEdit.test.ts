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

import { type KeyboardEvent } from 'react';

import { act, renderHook } from '@testing-library/react';

import { useInlineEdit } from '../useInlineEdit';

describe('useInlineEdit', () => {
  const defaultOptions = {
    currentName: 'Original Name',
    onSave: jest.fn(),
    onStart: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startEditing', () => {
    it('should set isEditing to true and seed editValue from currentName', () => {
      const { result } = renderHook(() => useInlineEdit(defaultOptions));

      expect(result.current.isEditing).toBe(false);
      expect(result.current.editValue).toBe('');

      act(() => {
        result.current.startEditing();
      });

      expect(result.current.isEditing).toBe(true);
      expect(result.current.editValue).toBe('Original Name');
    });

    it('should call onStart callback when editing begins', () => {
      const { result } = renderHook(() => useInlineEdit(defaultOptions));

      act(() => {
        result.current.startEditing();
      });

      expect(defaultOptions.onStart).toHaveBeenCalledTimes(1);
    });

    it('should work without onStart callback', () => {
      const { result } = renderHook(() =>
        useInlineEdit({
          currentName: 'Test',
          onSave: jest.fn(),
        }),
      );

      act(() => {
        result.current.startEditing();
      });

      expect(result.current.isEditing).toBe(true);
    });
  });

  describe('cancelEditing', () => {
    it('should reset isEditing to false and clear editValue', () => {
      const { result } = renderHook(() => useInlineEdit(defaultOptions));

      act(() => {
        result.current.startEditing();
      });
      expect(result.current.isEditing).toBe(true);

      act(() => {
        result.current.cancelEditing();
      });

      expect(result.current.isEditing).toBe(false);
      expect(result.current.editValue).toBe('');
    });
  });

  describe('save', () => {
    it('should call onSave with trimmed value when name differs from currentName', () => {
      const onSave = jest.fn();
      const { result } = renderHook(() =>
        useInlineEdit({ ...defaultOptions, onSave }),
      );

      act(() => {
        result.current.startEditing();
      });
      act(() => {
        result.current.setEditValue('  New Name  ');
      });
      act(() => {
        result.current.save();
      });

      expect(onSave).toHaveBeenCalledWith('New Name');
    });

    it('should NOT call onSave if value is unchanged (same as currentName)', () => {
      const onSave = jest.fn();
      const { result } = renderHook(() =>
        useInlineEdit({ ...defaultOptions, onSave }),
      );

      act(() => {
        result.current.startEditing();
      });
      act(() => {
        result.current.save();
      });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should NOT call onSave if value is empty or whitespace', () => {
      const onSave = jest.fn();
      const { result } = renderHook(() =>
        useInlineEdit({ ...defaultOptions, onSave }),
      );

      act(() => {
        result.current.startEditing();
      });
      act(() => {
        result.current.setEditValue('   ');
      });
      act(() => {
        result.current.save();
      });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should cancel editing after save', () => {
      const onSave = jest.fn();
      const { result } = renderHook(() =>
        useInlineEdit({ ...defaultOptions, onSave }),
      );

      act(() => {
        result.current.startEditing();
      });
      act(() => {
        result.current.setEditValue('New Name');
      });
      act(() => {
        result.current.save();
      });

      expect(result.current.isEditing).toBe(false);
      expect(result.current.editValue).toBe('');
    });

    it('should cancel editing when value is unchanged', () => {
      const { result } = renderHook(() => useInlineEdit(defaultOptions));

      act(() => {
        result.current.startEditing();
      });
      act(() => {
        result.current.save();
      });

      expect(result.current.isEditing).toBe(false);
    });
  });

  describe('handleKeyDown', () => {
    it('should save on Enter key', () => {
      const onSave = jest.fn();
      const { result } = renderHook(() =>
        useInlineEdit({ ...defaultOptions, onSave }),
      );

      act(() => {
        result.current.startEditing();
      });
      act(() => {
        result.current.setEditValue('Updated');
      });
      act(() => {
        result.current.handleKeyDown({
          key: 'Enter',
          preventDefault: jest.fn(),
        } as unknown as KeyboardEvent);
      });

      expect(onSave).toHaveBeenCalledWith('Updated');
    });

    it('should cancel on Escape key', () => {
      const onSave = jest.fn();
      const { result } = renderHook(() =>
        useInlineEdit({ ...defaultOptions, onSave }),
      );

      act(() => {
        result.current.startEditing();
      });
      act(() => {
        result.current.setEditValue('Something');
      });
      act(() => {
        result.current.handleKeyDown({
          key: 'Escape',
          preventDefault: jest.fn(),
        } as unknown as KeyboardEvent);
      });

      expect(onSave).not.toHaveBeenCalled();
      expect(result.current.isEditing).toBe(false);
    });

    it('should not react to other keys', () => {
      const onSave = jest.fn();
      const { result } = renderHook(() =>
        useInlineEdit({ ...defaultOptions, onSave }),
      );

      act(() => {
        result.current.startEditing();
      });
      act(() => {
        result.current.setEditValue('Changed');
      });
      act(() => {
        result.current.handleKeyDown({
          key: 'Tab',
          preventDefault: jest.fn(),
        } as unknown as KeyboardEvent);
      });

      expect(onSave).not.toHaveBeenCalled();
      expect(result.current.isEditing).toBe(true);
    });
  });

  describe('setEditValue', () => {
    it('should update the edit value', () => {
      const { result } = renderHook(() => useInlineEdit(defaultOptions));

      act(() => {
        result.current.startEditing();
      });
      act(() => {
        result.current.setEditValue('New Value');
      });

      expect(result.current.editValue).toBe('New Value');
    });
  });
});

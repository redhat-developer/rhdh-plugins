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

import { useCallback, useRef, useState } from 'react';

type UseInlineEditOptions = {
  currentName: string;
  onSave: (newName: string) => void;
  onStart?: () => void;
};

export const useInlineEdit = ({
  currentName,
  onSave,
  onStart,
}: UseInlineEditOptions) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setEditValue(currentName);
    onStart?.();
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [currentName, onStart]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  const save = useCallback(() => {
    if (savingRef.current) return;
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === currentName) {
      cancelEditing();
      return;
    }
    savingRef.current = true;
    onSave(trimmed);
    cancelEditing();
    savingRef.current = false;
  }, [editValue, currentName, onSave, cancelEditing]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        save();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelEditing();
      }
    },
    [save, cancelEditing],
  );

  return {
    isEditing,
    editValue,
    setEditValue,
    inputRef,
    startEditing,
    cancelEditing,
    save,
    handleKeyDown,
  };
};

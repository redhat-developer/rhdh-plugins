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
import { useCallback, useState } from 'react';

import { SavedPrompt } from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

type UseSavedPromptActionsOptions = {
  onApplyToInput: (content: string) => void;
  onSendDirectly: (content: string) => void;
  onDelete: (promptId: string) => Promise<void>;
};

export const useSavedPromptActions = ({
  onApplyToInput,
  onSendDirectly,
  onDelete,
}: UseSavedPromptActionsOptions) => {
  const [promptToDelete, setPromptToDelete] = useState<SavedPrompt | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const applyToInput = useCallback(
    (content: string) => {
      onApplyToInput(content);
    },
    [onApplyToInput],
  );

  const sendDirectly = useCallback(
    (content: string) => {
      onSendDirectly(content);
    },
    [onSendDirectly],
  );

  const requestDelete = useCallback((prompt: SavedPrompt) => {
    setDeleteError(null);
    setPromptToDelete(prompt);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setPromptToDelete(null);
    setDeleteError(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!promptToDelete) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(promptToDelete.id);
      setPromptToDelete(null);
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : 'Failed to delete saved prompt',
      );
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, promptToDelete]);

  return {
    applyToInput,
    sendDirectly,
    requestDelete,
    promptToDelete,
    closeDeleteModal,
    confirmDelete,
    isDeleting,
    deleteError,
    isDeleteModalOpen: promptToDelete !== null,
  };
};

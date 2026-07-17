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

import { Divider } from '@material-ui/core';
import { FileDetailsLabel } from '@patternfly/chatbot';

import { useFileAttachmentContext } from './AttachmentContext';

const FilePreview = () => {
  const {
    fileContents,
    isLoadingFile,
    modalState,
    setFileContents,
    setCurrentFileContent,
  } = useFileAttachmentContext();

  const { setIsEditModalOpen, setIsPreviewModalOpen, setPreviewModalKey } =
    modalState;

  const onAttachmentClick = (_: React.MouseEvent, name: string) => {
    const file = fileContents?.find(f => f.name === name);
    setCurrentFileContent({
      name,
      type: file?.type ?? 'text/plain',
      content: file?.content ?? '',
    });
    setPreviewModalKey(prev => prev + 1); // update key to re-render content
    setIsEditModalOpen(false);
    setIsPreviewModalOpen(true);
  };

  const removeFile = (indexToRemove: number) => {
    setFileContents(prevContents =>
      prevContents.filter((_, index) => index !== indexToRemove),
    );
  };

  return (
    <>
      {fileContents.length > 0 && <Divider />}
      {fileContents && (
        <div style={{ display: 'flex', gap: '10px' }}>
          {fileContents.map((file, index) => (
            <FileDetailsLabel
              key={index}
              fileName={file.name}
              isLoading={isLoadingFile[file.name]}
              onClick={onAttachmentClick}
              onClose={() => {
                removeFile(index);
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default FilePreview;

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
import React from 'react';

import { FileContent } from '../types';
import { isSupportedFileType, readFileAsText } from '../utils/attachment-utils';

type UploadError = { type?: 'info' | 'danger'; message: string | null };
interface FileAttachmentContextType {
  showAlert: boolean;
  uploadError: UploadError;
  fileContents: FileContent[];
  isLoadingFile: Record<string, boolean>;
  handleFileUpload: (files: File[]) => void;
  setFileContents: React.Dispatch<React.SetStateAction<FileContent[]>>;
  setUploadError: React.Dispatch<React.SetStateAction<UploadError>>;
  currentFileContent?: FileContent;
  setCurrentFileContent: React.Dispatch<
    React.SetStateAction<FileContent | undefined>
  >;
  modalState: {
    previewModalKey: number;
    setPreviewModalKey: React.Dispatch<React.SetStateAction<number>>;
    isPreviewModalOpen: boolean;
    setIsPreviewModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isEditModalOpen: boolean;
    setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };
}

export const FileAttachmentContext =
  React.createContext<FileAttachmentContextType | null>(null);

const FileAttachmentContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [currentFileContent, setCurrentFileContent] = React.useState<
    FileContent | undefined
  >();
  const [isLoadingFile, setIsLoadingFile] = React.useState<
    Record<string, boolean>
  >({});
  const [previewModalKey, setPreviewModalKey] = React.useState<number>(0);
  const [showAlert, setShowAlert] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<UploadError>({
    message: null,
  });
  const [fileContents, setFileContents] = React.useState<FileContent[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] =
    React.useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState<boolean>(false);
  const handleFileUpload = (fileArr: File[]) => {
    const existingFile = fileContents.find(
      file => file.name === fileArr[0].name,
    );
    if (existingFile) {
      setShowAlert(true);
      setUploadError({ type: 'info', message: 'File already exists.' });
      return;
    }

    setIsLoadingFile({ [fileArr[0].name]: true });

    if (fileArr.length > 1) {
      setShowAlert(true);
      setUploadError({
        message: 'Uploaded more than one file.',
      });
      return;
    }
    if (!isSupportedFileType(fileArr[0])) {
      setShowAlert(true);
      setUploadError({
        message:
          'Unsupported file type. Supported types are: .txt, .yaml, .json.',
      });
      return;
    }

    // this is 25MB in bytes; size is in bytes
    if (fileArr[0].size > 25000000) {
      setShowAlert(true);
      setUploadError({
        message:
          'Your file size is too large. Please ensure that your file is less than 25 MB.',
      });
      return;
    }

    readFileAsText(fileArr[0])
      .then(data => {
        setFileContents(prev => [
          ...prev,
          {
            name: fileArr[0].name,
            type: fileArr[0].type,
            content: data as string,
          },
        ]);
        setShowAlert(false);
        setUploadError({ message: null });
        setIsLoadingFile({ [fileArr[0].name]: false });
      })
      .catch((error: DOMException) => {
        setUploadError({
          message: `Failed to read file: ${error.message}`,
        });
      });
  };

  const modalState = {
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    previewModalKey,
    setPreviewModalKey,
  };
  return (
    <FileAttachmentContext.Provider
      value={{
        modalState,
        fileContents,
        setFileContents,
        handleFileUpload,
        isLoadingFile,
        showAlert,
        uploadError,
        setUploadError,
        currentFileContent,
        setCurrentFileContent,
      }}
    >
      {children}
    </FileAttachmentContext.Provider>
  );
};

export default FileAttachmentContextProvider;

export const useFileAttachmentContext = (): FileAttachmentContextType => {
  const context = React.useContext<FileAttachmentContextType | null>(
    FileAttachmentContext,
  );

  if (context === null) {
    throw new Error(
      'useFileAttachmentContext must be within a FileAttachmentContextProvider',
    );
  }

  return context;
};

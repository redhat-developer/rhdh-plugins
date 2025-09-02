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

import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';

import { useTranslation } from '../hooks/useTranslation';
import { FileContent } from '../types';
import { isSupportedFileType, readFileAsText } from '../utils/attachment-utils';

type UploadError = { type?: 'info' | 'danger'; message: string | null };
interface FileAttachmentContextType {
  showAlert: boolean;
  uploadError: UploadError;
  fileContents: FileContent[];
  isLoadingFile: Record<string, boolean>;
  handleFileUpload: (files: File[]) => void;
  setFileContents: Dispatch<SetStateAction<FileContent[]>>;
  setUploadError: Dispatch<SetStateAction<UploadError>>;
  setShowAlert: Dispatch<SetStateAction<boolean>>;
  currentFileContent?: FileContent;
  setCurrentFileContent: Dispatch<SetStateAction<FileContent | undefined>>;
  modalState: {
    previewModalKey: number;
    setPreviewModalKey: Dispatch<SetStateAction<number>>;
    isPreviewModalOpen: boolean;
    setIsPreviewModalOpen: Dispatch<SetStateAction<boolean>>;
    isEditModalOpen: boolean;
    setIsEditModalOpen: Dispatch<SetStateAction<boolean>>;
  };
}

export const FileAttachmentContext =
  createContext<FileAttachmentContextType | null>(null);

const FileAttachmentContextProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { t } = useTranslation();
  const [currentFileContent, setCurrentFileContent] = useState<
    FileContent | undefined
  >();
  const [isLoadingFile, setIsLoadingFile] = useState<Record<string, boolean>>(
    {},
  );
  const [previewModalKey, setPreviewModalKey] = useState<number>(0);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<UploadError>({
    message: null,
  });
  const [fileContents, setFileContents] = useState<FileContent[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const handleFileUpload = (fileArr: File[]) => {
    const existingFile = fileContents.find(
      file => file.name === fileArr[0].name,
    );
    if (existingFile) {
      setShowAlert(true);
      setUploadError({
        type: 'info',
        message: t('file.upload.error.alreadyExists'),
      });
      return;
    }

    setIsLoadingFile({ [fileArr[0].name]: true });

    if (fileArr.length > 1) {
      setShowAlert(true);
      setUploadError({
        message: t('file.upload.error.multipleFiles'),
      });
      return;
    }
    if (!isSupportedFileType(fileArr[0])) {
      setShowAlert(true);
      setUploadError({
        message: t('file.upload.error.unsupportedType'),
      });
      return;
    }

    // this is 25MB in bytes; size is in bytes
    if (fileArr[0].size > 25000000) {
      setShowAlert(true);
      setUploadError({
        message: t('file.upload.error.fileTooLarge'),
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
          message: t('file.upload.error.readFailed' as any, {
            errorMessage: error.message,
          }),
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
        setShowAlert,
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
  const { t } = useTranslation();
  const context = useContext<FileAttachmentContextType | null>(
    FileAttachmentContext,
  );

  if (context === null) {
    // The error message is developer-facing and typically not translated
    throw new Error(t('error.context.fileAttachment'));
  }

  return context;
};

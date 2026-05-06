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

import { ChangeEvent, Ref, useRef, useState } from 'react';
import { DropEvent, FileRejection } from 'react-dropzone';

import { makeStyles } from '@material-ui/core';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { PaperclipIcon, PlusIcon } from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';

type AttachPlusMenuProps = {
  onAttach: (
    data: File[],
    event: DropEvent | ChangeEvent<HTMLInputElement>,
  ) => void;
  allowedFileTypes?: { [key: string]: string[] };
  onAttachRejected?: (rejections: FileRejection[]) => void;
};

const useStyles = makeStyles(theme => ({
  plusButton: {
    width: 40,
    height: 40,
    padding: 0,
    minWidth: 0,
    borderRadius: '50%',
    backgroundColor: 'transparent',
    color: '#6a7282',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
  },
  dropdown: {
    padding: 0,
    '& ul': {
      padding: 0,
    },
    '& .pf-v6-c-menu__content, & .pf-v5-c-menu__content': {
      paddingTop: 4,
      paddingBottom: 4,
    },
  },
  menuItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    padding: theme.spacing(1.5),
    cursor: 'pointer',
    minWidth: 280,
    '--pf-v6-c-menu__item--PaddingTop': `${theme.spacing(1.5)}px`,
    '--pf-v6-c-menu__item--PaddingBottom': `${theme.spacing(1.5)}px`,
  },
  menuItemContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    width: '100%',
  },
  menuItemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#151515',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#707070',
    paddingLeft: 26,
  },
  paperclipIcon: {
    width: 17.5,
    height: 20,
    color: '#151515',
  },
  hiddenInput: {
    display: 'none',
  },
}));

export const AttachPlusMenu = ({
  onAttach,
  allowedFileTypes,
  onAttachRejected,
}: AttachPlusMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const classes = useStyles();
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    setIsMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (allowedFileTypes && onAttachRejected) {
      const allowedExtensions = Object.values(allowedFileTypes).flat();
      const accepted: File[] = [];
      const rejected: FileRejection[] = [];

      files.forEach(file => {
        const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (allowedExtensions.includes(ext)) {
          accepted.push(file);
        } else {
          rejected.push({
            file,
            errors: [
              {
                code: 'file-invalid-type',
                message: `File type ${ext} is not supported`,
              },
            ],
          });
        }
      });

      if (rejected.length > 0) {
        onAttachRejected(rejected);
      }

      if (accepted.length > 0) {
        onAttach(accepted, event);
      }
    } else {
      onAttach(files, event);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const acceptTypes = allowedFileTypes
    ? Object.entries(allowedFileTypes)
        .map(([mime, exts]) => [mime, ...exts])
        .flat()
        .join(',')
    : undefined;

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      isExpanded={isMenuOpen}
      variant="plain"
      className={classes.plusButton}
      aria-label={t('tooltip.attach')}
    >
      <PlusIcon />
    </MenuToggle>
  );

  return (
    <>
      <Dropdown
        className={classes.dropdown}
        isOpen={isMenuOpen}
        onSelect={() => setIsMenuOpen(false)}
        onOpenChange={isOpen => setIsMenuOpen(isOpen)}
        toggle={toggle}
        popperProps={{ position: 'left' }}
      >
        <DropdownList>
          <DropdownItem
            onClick={handleAttachClick}
            className={classes.menuItem}
          >
            <div className={classes.menuItemContent}>
              <div className={classes.menuItemHeader}>
                <PaperclipIcon className={classes.paperclipIcon} />
                {t('attach.menu.title')}
              </div>
              <div className={classes.menuItemDescription}>
                {t('attach.menu.description')}
              </div>
            </div>
          </DropdownItem>
        </DropdownList>
      </Dropdown>
      <input
        ref={fileInputRef}
        type="file"
        className={classes.hiddenInput}
        onChange={handleFileChange}
        accept={acceptTypes}
        data-testid="attachment-input"
      />
    </>
  );
};

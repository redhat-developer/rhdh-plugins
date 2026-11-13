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

import type { ComponentProps, CSSProperties } from 'react';

import {
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiErrorWarningFill,
  RiErrorWarningLine,
  RiExternalLinkLine,
  RiInformationLine,
  RiQuestionLine,
  RiRefreshLine,
} from '@remixicon/react';

/** Matches 0.875rem table/link text where these icons appear most often. */
const defaultSize = 14;

type BulkImportIconProps = Omit<
  ComponentProps<typeof RiExternalLinkLine>,
  'children'
> & { size?: number };

/** Inline icon immediately after link text (same line as the URL’s last character). */
export const bulkImportExternalLinkStyle: CSSProperties = {
  display: 'inline-block',
  verticalAlign: '-0.125em',
  marginLeft: '0.125em',
  color: 'currentColor',
};

/** Keeps the anchor in normal text flow so the icon follows the label, not the cell edge. */
export const bulkImportExternalLinkLinkStyle: CSSProperties = {
  display: 'inline',
};

export const BulkImportExternalLinkIcon = ({
  size = defaultSize,
  style,
  ...props
}: BulkImportIconProps) => (
  <RiExternalLinkLine
    size={size}
    data-testid="external-link-icon"
    style={{ ...bulkImportExternalLinkStyle, ...style }}
    {...props}
  />
);

export const BulkImportCloseIcon = ({
  size = defaultSize,
  ...props
}: BulkImportIconProps) => <RiCloseLine size={size} {...props} />;

export const BulkImportClearIcon = ({
  size = defaultSize,
  ...props
}: BulkImportIconProps) => <RiCloseLine size={size} {...props} />;

export const BulkImportDeleteIcon = ({
  size = defaultSize,
  ...props
}: BulkImportIconProps) => <RiDeleteBinLine size={size} {...props} />;

export const BulkImportEditIcon = ({
  size = defaultSize,
  ...props
}: BulkImportIconProps) => <RiEditLine size={size} {...props} />;

export const BulkImportSyncIcon = ({
  size = defaultSize,
  ...props
}: BulkImportIconProps) => <RiRefreshLine size={size} {...props} />;

export const BulkImportHelpIcon = ({
  size = defaultSize,
  ...props
}: BulkImportIconProps) => <RiQuestionLine size={size} {...props} />;

export const BulkImportErrorIcon = ({
  size = defaultSize,
  color = 'var(--bui-fg-danger, #c9190b)',
  style,
  ...props
}: BulkImportIconProps) => (
  <RiErrorWarningLine
    size={size}
    color={color}
    style={{ verticalAlign: 'sub', paddingTop: '7px', ...style }}
    {...props}
  />
);

export const BulkImportInfoIcon = ({
  size = defaultSize,
  color = 'var(--bui-fg-info, #2b9af3)',
  style,
  ...props
}: BulkImportIconProps) => (
  <RiInformationLine
    size={size}
    color={color}
    style={{ verticalAlign: 'sub', paddingTop: '7px', ...style }}
    {...props}
  />
);

export const BulkImportWarningIcon = ({
  size = defaultSize,
  style,
  ...props
}: BulkImportIconProps) => (
  <RiErrorWarningFill
    size={size}
    color="#F0AB00"
    style={{ verticalAlign: 'middle', ...style }}
    {...props}
  />
);

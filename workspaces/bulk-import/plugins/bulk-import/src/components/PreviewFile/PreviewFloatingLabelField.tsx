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

import type { CSSProperties, ReactNode } from 'react';

export type PreviewFloatingLabelFieldProps = {
  label: string;
  required?: boolean;
  hasValue: boolean;
  /** Use for textareas so the label stays on the border when content is prefilled. */
  multiline?: boolean;
  /** BUI Combobox: use the outlined wrapper; keep popover/chevron interactive. */
  combobox?: boolean;
  description?: ReactNode;
  isInvalid?: boolean;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * MUI-style outlined floating label around BUI fields (preview drawer only).
 * Child controls must omit `label` / `description` and set `aria-label` instead.
 */
export const PreviewFloatingLabelField = ({
  label,
  required,
  hasValue,
  multiline,
  combobox,
  description,
  isInvalid,
  style,
  children,
}: PreviewFloatingLabelFieldProps) => {
  const labelText = required ? `${label} *` : label;
  const shrinkLabel = hasValue || !!multiline;

  const classNames = [
    'bulk-import-floating-field',
    shrinkLabel ? 'bulk-import-floating-field--shrink-label' : '',
    multiline ? 'bulk-import-floating-field--multiline' : '',
    combobox ? 'bulk-import-floating-field--combobox' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      data-has-value={hasValue ? 'true' : undefined}
      data-invalid={isInvalid ? 'true' : undefined}
      style={style}
    >
      <div className="bulk-import-floating-field__control">
        {children}
        <label className="bulk-import-floating-field__label">{labelText}</label>
      </div>
      {description ? (
        <div className="bulk-import-floating-field__helper">{description}</div>
      ) : null}
    </div>
  );
};

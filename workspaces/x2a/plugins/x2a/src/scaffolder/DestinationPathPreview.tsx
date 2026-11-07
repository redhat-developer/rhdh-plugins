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

import { useEffect } from 'react';
import { TextField } from '@material-ui/core';
import type { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';

type TemplateFormData = {
  destinationConfigDirectory?: string;
  projectDirName?: string;
  artifactPath?: string;
};

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

/** Displays the complete repository path generated from the destination root. */
export function DestinationPathPreview({
  formContext,
  formData,
  onChange,
  schema,
}: FieldExtensionComponentProps<string>) {
  const values = (formContext as { formData?: TemplateFormData } | undefined)
    ?.formData;
  const artifactParts = values?.artifactPath?.split('/').filter(Boolean) ?? [];
  const moduleDirectory = artifactParts.at(-1) ?? '';
  const destinationPath = [
    values?.destinationConfigDirectory,
    values?.projectDirName,
    moduleDirectory,
  ]
    .filter((value): value is string => Boolean(value))
    .map(trimSlashes)
    .join('/');

  useEffect(() => {
    if (destinationPath && formData !== destinationPath) {
      onChange(destinationPath);
    }
  }, [destinationPath, formData, onChange]);

  return (
    <TextField
      fullWidth
      label={schema.title}
      value={destinationPath}
      helperText={schema.description}
      InputProps={{ readOnly: true }}
      variant="outlined"
      margin="normal"
    />
  );
}

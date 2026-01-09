/*
 * Copyright The Backstage Authors
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

import { ExtensionsPackageAppConfigExamples } from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { JsonObject } from '@backstage/types';

import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useCodeEditor } from './CodeEditorContext';
import { Markdown } from './Markdown';
import { applyContent, getExampleAsMarkdown } from '../utils';
import { useTranslation } from '../hooks/useTranslation';

interface TabPanelProps {
  markdownContent: string | ExtensionsPackageAppConfigExamples[];
  index: number;
  value: number;
  title?: string;
  others?: { [key: string]: any };
}

export const TabPanel = ({
  markdownContent,
  index,
  value,
  others,
  title,
}: TabPanelProps) => {
  const { t } = useTranslation();
  const alertApi = useApi(alertApiRef);
  const codeEditor = useCodeEditor();
  if (value !== index) return null;

  const handleApplyContent = (content: string | JsonObject, pkg: string) => {
    try {
      const codeEditorContent = codeEditor.getValue();
      const newContent = applyContent(
        codeEditorContent || '',
        pkg,
        others?.packageNames,
        content,
      );
      const selection = codeEditor.getSelection();
      const position = codeEditor.getPosition();
      if (newContent) {
        codeEditor.setValue(newContent);
        if (selection) {
          codeEditor.setSelection(selection);
        }
        if (position) {
          codeEditor.setPosition(position);
        }
      }
    } catch (error) {
      alertApi.post({
        display: 'transient',
        severity: 'warning',
        message: t('common.couldNotApplyYaml' as any, { error }),
      });
    }
  };

  return (
    <Box
      role="tabpanel"
      sx={{ flex: 1, overflow: 'auto', p: 2, scrollbarWidth: 'thin' }}
    >
      <Typography component="div">
        {title && <Typography variant="h5">{title}</Typography>}
        {Array.isArray(markdownContent) ? (
          markdownContent.map((item, idx) => (
            <Box key={idx} sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                {Object.keys(item)[0]}
              </Typography>
              {item?.[Object.keys(item)[0]]?.map?.(ex => (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {ex.title}
                    {ex.content !== 'string' && (
                      <Button
                        sx={{ float: 'right' }}
                        onClick={() =>
                          handleApplyContent(ex.content, Object.keys(item)[0])
                        }
                      >
                        {t('common.apply')}
                      </Button>
                    )}
                  </Typography>
                  <Markdown content={getExampleAsMarkdown(ex.content)} />
                </>
              ))}
            </Box>
          ))
        ) : (
          <Markdown content={markdownContent} />
        )}
      </Typography>
    </Box>
  );
};

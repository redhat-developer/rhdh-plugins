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

import { CodeSnippet, WarningPanel } from '@backstage/core-components';
import {
  DYNAMIC_PLUGIN_CONFIG_YAML,
  EXTENSIONS_CONFIG_YAML,
  ExtensionsStatus,
  getErrorMessage,
} from '../utils';
import { useTranslation } from '../hooks/useTranslation';

export const InstallationWarning = ({ configData }: { configData: any }) => {
  const { t } = useTranslation();
  const errorMessage = getErrorMessage(
    configData?.error?.reason,
    configData?.error?.message,
    t,
  );

  return (
    <>
      <WarningPanel
        title={errorMessage.title}
        severity="info"
        message={
          <>
            {errorMessage.message}
            <CodeSnippet
              language="yaml"
              showLineNumbers
              highlightedNumbers={errorMessage?.highlightedLineNumbers}
              text={`${
                configData?.error?.reason === ExtensionsStatus.INVALID_CONFIG
                  ? DYNAMIC_PLUGIN_CONFIG_YAML
                  : EXTENSIONS_CONFIG_YAML
              }`}
            />
          </>
        }
      />
      <br />
    </>
  );
};

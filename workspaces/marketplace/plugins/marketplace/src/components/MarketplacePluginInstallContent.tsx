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

import React from 'react';

import { ErrorPage, Progress } from '@backstage/core-components';
import { useRouteRefParams } from '@backstage/core-plugin-api';

import Button from '@mui/material/Button';
import yaml from 'yaml';
import { useCopyToClipboard } from 'react-use';

import {
  MarketplacePackage,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { pluginInstallRouteRef } from '../routes';
import { usePlugin } from '../hooks/usePlugin';
import { usePluginPackages } from '../hooks/usePluginPackages';
import {
  CodeEditorContextProvider,
  CodeEditor,
  useCodeEditor,
} from './CodeEditor';

export const MarketplacePluginInstallContent = ({
  plugin,
  packages,
}: {
  plugin: MarketplacePlugin;
  packages: MarketplacePackage[];
}) => {
  const codeEditor = useCodeEditor();

  const onLoaded = React.useCallback(() => {
    const dynamicPluginYaml = {
      plugins: (packages ?? []).map(pkg => ({
        package: pkg.spec?.dynamicArtifact ?? './dynamic-plugins/dist/....',
        disabled: false,
      })),
    };
    codeEditor.setValue(yaml.stringify(dynamicPluginYaml));
  }, [codeEditor, packages]);

  // Just a demo
  const showFullPlugin = React.useCallback(() => {
    codeEditor.setValue(yaml.stringify(plugin));
  }, [codeEditor, plugin]);

  const [, copyToClipboard] = useCopyToClipboard();
  const handleCopyToClipboard = React.useCallback(() => {
    const value = codeEditor.getValue();
    if (value) {
      copyToClipboard(value);
    }
  }, [codeEditor, copyToClipboard]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1 }}>
        <CodeEditor defaultLanguage="yaml" onLoaded={onLoaded} />
      </div>
      <div style={{ paddingTop: 16 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onLoaded}
          sx={{ mr: 1 }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={showFullPlugin}
          sx={{ mr: 1 }}
        >
          Show full plugin
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCopyToClipboard}
        >
          Copy
        </Button>
      </div>
    </div>
  );
};

export const MarketplacePluginInstallContentLoader = () => {
  const params = useRouteRefParams(pluginInstallRouteRef);

  const plugin = usePlugin(params.namespace, params.name);
  const packages = usePluginPackages(params.namespace, params.name);

  if (plugin.isLoading || packages.isLoading) {
    return <Progress />;
  } else if (plugin.data && packages.data) {
    return (
      <CodeEditorContextProvider>
        <MarketplacePluginInstallContent
          plugin={plugin.data}
          packages={packages.data}
        />
      </CodeEditorContextProvider>
    );
  } else if (plugin.error) {
    return <ErrorPage statusMessage={plugin.error.toString()} />;
  } else if (packages.error) {
    return <ErrorPage statusMessage={packages.error.toString()} />;
  }
  return (
    <ErrorPage
      statusMessage={`Plugin ${params.namespace}/${params.name} not found!`}
    />
  );
};

/*
 * Copyright 2025 The Backstage Authors
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
import { MarketplacePluginEntry } from '../types';
import { inspect } from './api';
import { ImageRef } from './types';

export function isOciUri(uri: string): boolean {
  if (!uri) {
    return false;
  }
  return (
    uri.startsWith('oci://') ||
    uri.startsWith('docker://') ||
    uri.startsWith('quay.io/') ||
    uri.startsWith('docker.io/') ||
    uri.startsWith('ghcr.io/')
  );
}

export function parseImageRef(image: string): ImageRef {
  if (image.startsWith('oci://')) {
    // eslint-disable-next-line no-param-reassign
    image = image.slice(6);
  } else if (image.startsWith('docker://')) {
    // eslint-disable-next-line no-param-reassign
    image = image.slice(9);
  }

  let registry = 'docker.io'; // default registry
  let repository = image;
  let tag = 'latest'; // default tag

  const parts = image.split('/');
  if (parts.length < 1 || parts.length > 3) {
    throw new Error(`Invalid image name: ${image}`);
  }

  if (parts.length === 3) {
    registry = parts[0];
    repository = `${parts[1]}/${parts[2]}`;
  }

  if (repository.includes(':')) {
    const index = repository.lastIndexOf(':');
    tag = repository.slice(index + 1);
    repository = repository.slice(0, index);
  }

  return {
    registry,
    repository,
    tag,
  };
}

export async function extractPlugin(
  image: string,
): Promise<MarketplacePluginEntry> {
  // eslint-disable-next-line no-console
  console.log('Extracting from OCI image', image);
  // eslint-disable-next-line no-console
  console.log();

  const imageData = await inspect(image);

  const plugin: MarketplacePluginEntry = {
    apiVersion: 'marketplace.backstage.io/v1alpha1',
    kind: 'Plugin',
    metadata: {
      name: imageData.name,
      title: imageData.name,
      description: imageData.labels.summary,
    },
    spec: {
      type: 'frontend-plugin',
      lifecycle: 'unknown',
      owner: 'author',
      developer: imageData.labels.vendor,
      description: imageData.labels.description,
    },
  };
  return plugin;
}

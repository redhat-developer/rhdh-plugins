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
import { ImageRef, InspectResponse, Manifest, TagsList } from './types';
import { parseImageRef } from './utils';

// Based on https://github.com/containers/skopeo/blob/main/cmd/skopeo/inspect.go#L125C20-L162
// and https://github.com/containers/image/blob/main/manifest/docker_schema1.go#L239-L262

// TODO filter invalid tags https://github.com/containers/image/blob/16e3aee517f3280c6a82d169ff09190eac6c935b/docker/docker_image.go#L92-L110
export async function getTagsList(imageRef: ImageRef): Promise<TagsList> {
  // console.log('getTagsList', image);
  const url = `https://${imageRef.registry}/v2/${imageRef.repository}/tags/list`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch TagsList from ${url}: ${response.status} ${response.statusText}`,
    );
  }
  const json = await response.json();
  return json as TagsList;
}

export async function getManifest(imageRef: ImageRef): Promise<Manifest> {
  // console.log('getManifest', image, tag);
  const url = `https://${imageRef.registry}/v2/${imageRef.repository}/manifests/${imageRef.tag}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch manifest from ${url}: ${response.status} ${response.statusText}`,
    );
  }
  const json = await response.json();
  return json as Manifest;
}

export async function inspect(image: string): Promise<InspectResponse> {
  const imageRef = parseImageRef(image);
  // console.log('inpect', imageRef);
  // console.log();

  const manifest = await getManifest(imageRef);
  // console.log('manifest', manifest);
  // console.log();

  const v1Layer = JSON.parse(manifest.history[0].v1Compatibility);
  // console.log('v1Layer', v1Layer);
  // console.log();

  return {
    name: manifest.name,
    digest: manifest.tag,
    created: v1Layer.created,
    architecture: manifest.architecture,
    labels: v1Layer.config.Labels,
    env: v1Layer.config.Env,
  };
}

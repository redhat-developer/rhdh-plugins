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

import { createDevApp } from '@backstage/dev-utils';
import { TestApiProvider } from '@backstage/test-utils';

// eslint-disable-next-line @backstage/no-ui-css-imports-in-non-frontend
import '@backstage/ui/css/styles.css';

import ExtensionIcon from '@mui/icons-material/Extension';

import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';

import {
  openshiftImageRegistryApiRef,
  OpenshiftImageRegistryApiV1,
} from '../src/api';
import {
  OpenshiftImageRegistryPage,
  openshiftImageRegistryPlugin,
} from '../src/plugin';
// Contains just the openshift namespace for now
import namespaces from './namespaces.json';
// Extracted from an OpenShift 4.13 cluster, reduced to Go, Java, Node.js and Python entries
// oc get -n openshift \
//   imagestream/golang \
//   imagestream/java \
//   imagestream/nodejs \
//   imagestream/python \
//   -o json | jq . \
//   > plugins/openshift-image-registry/dev/openshift-imagestreams.json
import openshiftImageStreams from './openshift-imagestreams.json';
// The origin list view doesn't contain all neccessary infomation, so this list view
// is build from three API calls to match the data in openshift-imagestreams.json
//
// oc get -n openshift \
//   imagestreamtag/golang:1.18-ubi7 \
//   imagestreamtag/java:11 \
//   imagestreamtag/nodejs:14-ubi7 \
//   imagestreamtag/python:2.7-ubi8 \
//   -o json | jq . \
//   > plugins/openshift-image-registry/dev/openshift-imagestreamtags.json
import openshiftImageStreamTags from './openshift-imagestreamtags.json';

class MockOpenshiftImageRegistryApi implements OpenshiftImageRegistryApiV1 {
  async getAllImageStreams(): Promise<any> {
    return openshiftImageStreams.items;
  }
  async getImageStreams(ns: string): Promise<any> {
    return openshiftImageStreams.items.filter(
      item => item.metadata.namespace === ns,
    );
  }
  async getImageStream(ns: string, imageName: string): Promise<any> {
    return openshiftImageStreams.items.find(
      item =>
        item.metadata.namespace === ns && item.metadata.name === imageName,
    );
  }
  async getImageStreamTags(ns: string, imageName: string): Promise<any> {
    if (imageName.includes(':')) {
      return openshiftImageStreamTags.items.find(
        item =>
          item.metadata.namespace === ns && item.metadata.name === imageName,
      );
    }
    return openshiftImageStreamTags.items.find(
      item =>
        item.metadata.namespace === ns &&
        (item.metadata.name === imageName ||
          item.metadata.name.startsWith(`${imageName}:`)),
    );
  }
  async getImageStreamTag(
    ns: string,
    imageName: string,
    tag: string,
  ): Promise<any> {
    return openshiftImageStreamTags.items.find(
      item =>
        item.metadata.namespace === ns &&
        item.metadata.name === `${imageName}:${tag}`,
    );
  }
  async getNamespaces(): Promise<any> {
    return namespaces.items;
  }
}

createDevApp()
  .registerPlugin(openshiftImageRegistryPlugin)
  .addThemes(getAllThemes())
  .addPage({
    element: (
      <TestApiProvider
        apis={[
          [openshiftImageRegistryApiRef, new MockOpenshiftImageRegistryApi()],
        ]}
      >
        <OpenshiftImageRegistryPage />
      </TestApiProvider>
    ),
    title: 'Image Registry',
    path: '/openshift-image-registry',
    icon: ExtensionIcon,
  })
  .render();

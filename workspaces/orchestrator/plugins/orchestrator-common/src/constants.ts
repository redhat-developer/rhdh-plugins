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

/**
 * @public
 * DEFAULT_SONATAFLOW_CONTAINER_IMAGE
 * This container image is an upstream build of sonata 1.36 used for dev mode.
 * We will continue maintaining this constant to include the image that is compatible with the plugin code at any given time.
 * This approach will enable a more smooth dev mode experience, as opposed to using nightly or dayly builds.
 */
export const DEFAULT_SONATAFLOW_CONTAINER_IMAGE =
  'quay.io/kubesmarts/incubator-kie-sonataflow-devmode:main';
export const DEFAULT_SONATAFLOW_PERSISTENCE_PATH = '/home/kogito/persistence';
export const DEFAULT_SONATAFLOW_BASE_URL = 'http://localhost';

export const DEFAULT_WORKFLOWS_PATH = 'workflows';

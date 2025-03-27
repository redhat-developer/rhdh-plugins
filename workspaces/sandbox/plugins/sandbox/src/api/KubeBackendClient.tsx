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

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { errorMessage } from '../utils/common';
import {
  DeploymentData,
  PersistentVolumeClaimData,
  SecretItem,
  StatefulSetData,
} from '../types';

export type KubeBackendClientOptions = {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
};

export interface KubeAPIService {
  deleteSecretsAndPVCs(
    k8sObjects: StatefulSetData | DeploymentData | void,
    userNamespace: string,
  ): Promise<void>;
  deletePVCsForSTS(
    k8sObjects: StatefulSetData | void,
    userNamespace: string,
  ): Promise<void>;
  getSecret(
    namespace: string,
    secretName: string,
  ): Promise<SecretItem | undefined>;
  getPersistentVolumeClaims(
    namespace: string,
    labels?: string,
  ): Promise<PersistentVolumeClaimData | undefined>;
  getDeployments(
    namespace: string,
    labels?: string,
  ): Promise<DeploymentData | undefined>;
  getStatefulSets(
    namespace: string,
    labels?: string,
  ): Promise<StatefulSetData | undefined>;
}

export class KubeBackendClient implements KubeAPIService {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: KubeBackendClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private readonly kubeAPI = async (): Promise<string> => {
    return `${await this.discoveryApi.getBaseUrl('proxy')}/kube-api`;
  };

  private readonly projectPersistentVolumeClaimUrl = (
    namespace: string,
    labelSelector?: string,
  ): string => {
    let url = `/api/v1/namespaces/${namespace}/persistentvolumeclaims`;
    if (labelSelector) {
      url += `?labelSelector=${labelSelector}`;
    }
    return url;
  };

  private readonly projectDeploymentUrl = (
    namespace: string,
    labelSelector?: string,
  ) => {
    let url = `/apis/apps/v1/namespaces/${namespace}/deployments`;
    if (labelSelector) {
      url += `?labelSelector=${labelSelector}`;
    }
    return url;
  };

  private readonly projectStatefulSetUrl = (
    namespace: string,
    labelSelector?: string,
  ) => {
    let url = `/apis/apps/v1/namespaces/${namespace}/statefulsets`;
    if (labelSelector) {
      url += `?labelSelector=${labelSelector}`;
    }
    return url;
  };

  deleteSecretsAndPVCs = async (
    k8sObjects: StatefulSetData | DeploymentData | void,
    userNamespace: string,
  ): Promise<void> => {
    if (k8sObjects && k8sObjects.items.length > 0) {
      const kubeApi = await this.kubeAPI();

      for (const k8sObject of k8sObjects.items) {
        const volumes = k8sObject?.spec?.template?.spec?.volumes;
        if (!volumes) continue;

        for (const volume of volumes) {
          // delete pvc if any
          if (volume.persistentVolumeClaim?.claimName) {
            const pvcURL = `/api/v1/namespaces/${userNamespace}/persistentvolumeclaims/${volume.persistentVolumeClaim.claimName}`;
            const response = await this.fetchApi.fetch(`${kubeApi}${pvcURL}`, {
              method: 'DELETE',
            });
            if (!response.ok && response.status !== 404) {
              const error = await response.json();
              throw new Error(errorMessage(error));
            }
          }

          // delete secret if any
          if (volume.secret?.secretName) {
            const secretURL = `/api/v1/namespaces/${userNamespace}/secrets/${volume.secret.secretName}`;
            const response = await this.fetchApi.fetch(
              `${kubeApi}${secretURL}`,
              {
                method: 'DELETE',
              },
            );
            if (!response.ok && response.status !== 404) {
              const error = await response.json();
              throw new Error(errorMessage(error));
            }
          }
        }
      }
    }
  };

  deletePVCsForSTS = async (
    k8sObjects: StatefulSetData | void,
    userNamespace: string,
  ): Promise<void> => {
    if (k8sObjects && k8sObjects.items.length > 0) {
      const kubeApi = await this.kubeAPI();

      for (const k8sObject of k8sObjects.items) {
        const volumeClaimTemplates = k8sObject?.spec?.volumeClaimTemplates;
        if (!volumeClaimTemplates) continue;

        for (const volumeClaim of volumeClaimTemplates) {
          const pvcs = await this.getPersistentVolumeClaims(
            userNamespace,
            `app.kubernetes.io%2Fname%3D${volumeClaim.metadata.name}`,
          );

          if (pvcs && pvcs.items.length > 0) {
            for (const pvc of pvcs.items) {
              const pvcURL = `/api/v1/namespaces/${userNamespace}/persistentvolumeclaims/${pvc.metadata.name}`;
              const response = await this.fetchApi.fetch(
                `${kubeApi}${pvcURL}`,
                {
                  method: 'DELETE',
                },
              );
              if (!response.ok && response.status !== 404) {
                const error = await response.json();
                throw new Error(errorMessage(error));
              }
            }
          }
        }
      }
    }
  };

  getSecret = async (
    namespace: string,
    secretName: string,
  ): Promise<SecretItem | undefined> => {
    const kubeApi = await this.kubeAPI();
    const projectSecretURL = `/api/v1/namespaces/${namespace}/secrets/${secretName}`;
    const response = await this.fetchApi.fetch(
      `${kubeApi}${projectSecretURL}`,
      {
        method: 'GET',
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
    return response.json();
  };

  getPersistentVolumeClaims = async (
    namespace: string,
    labels?: string,
  ): Promise<PersistentVolumeClaimData | undefined> => {
    const kubeApi = await this.kubeAPI();
    const url = this.projectPersistentVolumeClaimUrl(namespace, labels);
    const response = await this.fetchApi.fetch(`${kubeApi}${url}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
    return response.json();
  };

  getDeployments = async (
    namespace: string,
    labels?: string,
  ): Promise<DeploymentData | undefined> => {
    const kubeApi = await this.kubeAPI();
    const url = this.projectDeploymentUrl(namespace, labels);
    const response = await this.fetchApi.fetch(`${kubeApi}${url}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
    return response.json();
  };

  getStatefulSets = async (
    namespace: string,
    labels?: string,
  ): Promise<StatefulSetData | undefined> => {
    const kubeApi = await this.kubeAPI();
    const url = this.projectStatefulSetUrl(namespace, labels);
    const response = await this.fetchApi.fetch(`${kubeApi}${url}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
    return response.json();
  };
}

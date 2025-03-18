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

/// <reference path="../../@types/index.d.ts" />
import { ConfigApi, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import {
  AAPData,
  CommonResponse,
  DeploymentData,
  PersistentVolumeClaimData,
  RegistrationService,
  SecretItem,
  SignupData,
  StatefulSetData,
} from '../types';
import { isValidCountryCode, isValidPhoneNumber } from '../utils/phone-utils';
import { errorMessage } from '../utils/common';
import { AAPObject } from '../utils/aap-utils';

export type RegistrationBackendClientOptions = {
  configApi: ConfigApi;
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
};

export class RegistrationBackendClient implements RegistrationService {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;
  private readonly configApi: ConfigApi;

  constructor(options: RegistrationBackendClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
    this.configApi = options.configApi;
  }

  private getProxyBaseURL = async (): Promise<string> => {
    return this.discoveryApi.getBaseUrl('proxy');
  };

  private kubeAPI = async (): Promise<string> => {
    return `${await this.getProxyBaseURL()}/kube-api`;
  };

  private projectPersistentVolumeClaimUrl = (
    namespace: string,
    labelSelector?: string,
  ): string => {
    let url = `/api/v1/namespaces/${namespace}/persistentvolumeclaims`;
    if (labelSelector) {
      url += `?labelSelector=${labelSelector}`;
    }
    return url;
  };

  private projectDeploymentUrl = (
    namespace: string,
    labelSelector?: string,
  ) => {
    let url = `/apis/apps/v1/namespaces/${namespace}/deployments`;
    if (labelSelector) {
      url += `?labelSelector=${labelSelector}`;
    }
    return url;
  };

  private projectStatefulSetUrl = (
    namespace: string,
    labelSelector?: string,
  ) => {
    let url = `/apis/apps/v1/namespaces/${namespace}/statefulsets`;
    if (labelSelector) {
      url += `?labelSelector=${labelSelector}`;
    }
    return url;
  };

  getRecaptchaAPIKey = (): string => {
    return (
      this.configApi.getOptionalString('sandbox.recaptcha.siteKey') ??
      'test-api-key'
    );
  };

  getSignUpData = async (): Promise<SignupData | undefined> => {
    const signupURL = `${await this.getProxyBaseURL()}/signup`;
    const response = await this.fetchApi.fetch(signupURL);
    if (!response.ok) {
      if (response.status === 404) {
        return undefined;
      }
      throw new Error(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  };

  getRecaptchaToken = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const apiKey = this.getRecaptchaAPIKey();
      let timeout = false;
      const captchaTimeout = setTimeout(() => {
        timeout = true;
        reject('Recaptcha timeout.');
      }, 10000);
      if (grecaptcha?.enterprise) {
        grecaptcha.enterprise.ready(async () => {
          if (!timeout) {
            clearTimeout(captchaTimeout);
            try {
              resolve(
                await grecaptcha.enterprise.execute(apiKey, {
                  action: 'SIGNUP',
                }),
              );
            } catch (e) {
              reject('Recaptcha failure.');
            }
          }
        });
      } else {
        reject('Recaptcha failure.');
      }
    });
  };

  signup = async (): Promise<void> => {
    let token = '';
    try {
      token = await this.getRecaptchaToken();
    } catch (err) {
      throw new Error(`Error getting recaptcha token: ${err}`);
    }
    const signupURL = `${await this.getProxyBaseURL()}/signup`;
    await this.fetchApi.fetch(signupURL, {
      method: 'POST',
      headers: {
        'Recaptcha-Token': token,
      },
      body: null,
    });
  };

  initiatePhoneVerification = async (
    countryCode: string,
    phoneNumber: string,
  ): Promise<void> => {
    const verificationURL = `${await this.getProxyBaseURL()}/verification`;
    if (!isValidCountryCode(countryCode)) {
      throw new Error('Invalid country code.');
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number.');
    }
    const response = await this.fetchApi.fetch(verificationURL, {
      method: 'PUT',
      body: JSON.stringify({
        country_code: countryCode,
        phone_number: phoneNumber,
      }),
    });

    if (!response.ok) {
      const error: CommonResponse = await response.json();
      throw new Error(error?.message);
    }
  };

  completePhoneVerification = async (code: string): Promise<void> => {
    const verificationURL = `${await this.getProxyBaseURL()}/verification`;
    const response = await this.fetchApi.fetch(`${verificationURL}/${code}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error: CommonResponse = await response.json();
      throw new Error(error?.message);
    }
  };

  verifyActivationCode = async (code: string): Promise<void> => {
    const verificationURL = `${await this.getProxyBaseURL()}/activation-code`;
    const response = await this.fetchApi.fetch(verificationURL, {
      method: 'POST',
      body: JSON.stringify({
        code: code,
      }),
    });

    if (!response.ok) {
      const error: CommonResponse = await response.json();
      throw new Error(error?.message);
    }
  };

  getAAP = async (namespace: string): Promise<AAPData | undefined> => {
    const kubeApi = await this.kubeAPI();
    const projectAAPUrl = `/apis/aap.ansible.com/v1alpha1/namespaces/${namespace}/ansibleautomationplatforms`;
    const response = await this.fetchApi.fetch(`${kubeApi}${projectAAPUrl}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
    return response.json();
  };

  createAAP = async (namespace: string): Promise<void> => {
    const kubeApi = await this.kubeAPI();
    const projectAAPUrl = `/apis/aap.ansible.com/v1alpha1/namespaces/${namespace}/ansibleautomationplatforms`;
    const response = await this.fetchApi.fetch(`${kubeApi}${projectAAPUrl}`, {
      method: 'POST',
      body: AAPObject,
      headers: {
        'Content-Type': 'application/yaml',
      },
    });

    if (!response.ok && response.status !== 409) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
  };

  unIdleAAP = async (namespace: string): Promise<void> => {
    const kubeApi = await this.kubeAPI();
    const projectAAPUrl = `/apis/aap.ansible.com/v1alpha1/namespaces/${namespace}/ansibleautomationplatforms/sandbox-aap`;
    const response = await this.fetchApi.fetch(`${kubeApi}${projectAAPUrl}`, {
      method: 'PATCH',
      body: JSON.stringify({
        spec: {
          idle_aap: false,
        },
      }),
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
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

  deleteAAPCR = async (namespace: string): Promise<void> => {
    const kubeApi = await this.kubeAPI();
    const projectAAPUrl = `/apis/aap.ansible.com/v1alpha1/namespaces/${namespace}/ansibleautomationplatforms/sandbox-aap`;
    const response = await this.fetchApi.fetch(`${kubeApi}${projectAAPUrl}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(errorMessage(error));
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

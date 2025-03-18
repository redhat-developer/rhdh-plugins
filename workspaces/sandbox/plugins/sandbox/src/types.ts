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

export type Status =
  | 'unknown'
  | 'new'
  | 'verify'
  | 'pending-approval'
  | 'provisioning'
  | 'ready';

export type SignupData = {
  name: string;
  compliantUsername: string;
  username: string;
  givenName: string;
  familyName: string;
  company: string;
  status: SignUpStatusData;
  consoleURL?: string;
  proxyURL?: string;
  rhodsMemberURL?: string;
  cheDashboardURL?: string;
  apiEndpoint?: string;
  clusterName?: string;
  defaultUserNamespace?: string;
  startDate?: string;
  endDate?: string;
};

export type SignUpStatusData = {
  ready: boolean;
  reason: string;
  verificationRequired: boolean;
};

export type StatusCondition = {
  type: string;
  status: string;
  reason: string;
  message: string;
};

export type AAPItem = {
  status: {
    conditions: StatusCondition[];
    URL: string;
    adminPasswordSecret: string;
    adminUser: string;
  };
  spec: {
    idle_aap: boolean;
  };
  metadata: {
    name: string;
    uuid: string;
    creationTimestamp: string;
  };
};

export type AAPData = {
  items: AAPItem[];
};

export type CommonResponse = {
  status: string;
  code: number;
  message: string;
  details: string;
};

export type SecretItem = {
  data: {
    password: string;
  };
  metadata: {
    name: string;
    uuid: string;
    creationTimestamp: string;
  };
};

export interface RegistrationService {
  getRecaptchaAPIKey(): string;
  getSignUpData(): Promise<SignupData | undefined>;
  signup(): Promise<void>;
  initiatePhoneVerification(
    countryCode: string,
    phoneNumber: string,
  ): Promise<void>;
  completePhoneVerification(code: string): Promise<void>;
  verifyActivationCode(code: string): Promise<void>;
  getAAP(namespace: string): Promise<AAPData | undefined>;
  createAAP(namespace: string): Promise<void>;
  unIdleAAP(namespace: string): Promise<void>;
  deleteSecretsAndPVCs(
    k8sObjects: StatefulSetData | DeploymentData | void,
    userNamespace: string,
  ): Promise<void>;
  deletePVCsForSTS(
    k8sObjects: StatefulSetData | void,
    userNamespace: string,
  ): Promise<void>;
  deleteAAPCR(namespace: string): Promise<void>;
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

export type DeploymentItem = {
  status: {
    conditions: {
      type: string;
      status: string;
    }[];
  };
  spec: {
    replicas: number;
    template: {
      metadata: {
        labels: {
          app: string;
          deployment: string;
        };
      };
      spec: {
        volumes?: {
          name: string;
          persistentVolumeClaim?: {
            claimName: string;
          };
          secret?: {
            secretName: string;
          };
        }[];
      };
    };
  };
  metadata: {
    name: string;
    uuid: string;
    creationTimestamp: string;
    labels: {
      app: string;
    };
  };
};

export type DeploymentData = {
  items: DeploymentItem[];
};

export type PersistentVolumeClaimItem = {
  metadata: {
    name: string;
    uuid: string;
    creationTimestamp: string;
    labels: {
      app: string;
    };
  };
};

export type PersistentVolumeClaimData = {
  items: PersistentVolumeClaimItem[];
};

export type StateFulSetItem = {
  status: {
    conditions: {
      type: string;
      status: string;
    }[];
  };
  spec: {
    replicas: number;
    template: {
      metadata: {
        labels: {
          app: string;
          deployment: string;
        };
      };
      spec: {
        volumes?: {
          name: string;
          persistentVolumeClaim?: {
            claimName: string;
          };
          secret?: {
            secretName: string;
          };
        }[];
      };
    };
    volumeClaimTemplates?: {
      metadata: {
        name: string;
      };
    }[];
  };
  metadata: {
    name: string;
    uuid: string;
    creationTimestamp: string;
    labels: {
      app: string;
    };
  };
};

export type StatefulSetData = {
  items: StateFulSetItem[];
};

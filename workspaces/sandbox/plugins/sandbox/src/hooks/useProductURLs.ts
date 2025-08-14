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
import { useEffect, useState } from 'react';
import { useSandboxContext } from './useSandboxContext';
import { Product } from '../components/SandboxCatalog/productData';
import { SignupData } from '../types';

interface ProductURL {
  id: Product;
  url: string;
}

enum AppURL {
  DEVSPACES = 'devspaces',
  RHODS = 'rhods-dashboard-redhat-ods-applications',
}

export enum Intcmp {
  OPENSHIFT_CONSOLE = '701Pe00000dnCEYIA2',
  DEVSPACES = '701Pe00000doTQCIA2',
  RHODS = '701Pe00000do2uiIAA',
  OPENSHIFT_VIRT = '701Pe00000dov6IIAQ',
  AAP = '701Pe00000dowQXIAY',
}

const getAppsURL = (
  appRouteName: AppURL,
  consoleURL: string | undefined,
): string => {
  if (!consoleURL) {
    return '';
  }
  const index = consoleURL?.indexOf('.apps');
  if (index === -1) {
    return '';
  }
  // Get the appsURL, e.g., .apps.host.openshiftapps.com
  const appsURL = consoleURL?.substring(index);
  return `https://${appRouteName}${appsURL}`;
};

export const productsURLMapping = (userData: SignupData | undefined) => {
  const isProvisioned = userData?.status?.ready || false;
  return [
    {
      id: Product.OPENSHIFT_CONSOLE,
      url:
        isProvisioned && userData?.defaultUserNamespace
          ? `${userData?.consoleURL}/k8s/cluster/projects/${userData?.defaultUserNamespace}`
          : '',
    },
    {
      id: Product.OPENSHIFT_AI,
      url: isProvisioned ? `${userData?.rhodsMemberURL}` : '',
    },
    {
      id: Product.DEVSPACES,
      url: isProvisioned
        ? `${userData?.cheDashboardURL}` ||
          getAppsURL(AppURL.DEVSPACES, userData?.consoleURL)
        : '',
    },
    { id: Product.AAP, url: '' },
    {
      id: Product.OPENSHIFT_VIRT,
      url: isProvisioned
        ? `${userData?.consoleURL}/k8s/ns/${userData?.defaultUserNamespace}/virtualization-overview`
        : '',
    },
  ];
};

const useProductURLs = (): ProductURL[] => {
  const { userData } = useSandboxContext();
  const [productURLs, setProductURLs] = useState<ProductURL[]>([]);

  useEffect(() => {
    setProductURLs(productsURLMapping(userData));
  }, [userData]);

  return productURLs;
};

export default useProductURLs;

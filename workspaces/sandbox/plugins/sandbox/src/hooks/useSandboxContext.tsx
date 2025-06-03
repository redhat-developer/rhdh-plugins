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
import { isEqual } from 'lodash';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AAPData, SignupData } from '../types';
import { useApi } from '@backstage/core-plugin-api';
import { aapApiRef, kubeApiRef, registerApiRef } from '../api';
import { useRecaptcha } from './useRecaptcha';
import { LONG_INTERVAL, SHORT_INTERVAL } from '../const';
import { signupDataToStatus } from '../utils/register-utils';
import { AnsibleStatus, decode, getReadyCondition } from '../utils/aap-utils';
import { errorMessage } from '../utils/common';

interface SandboxContextType {
  userStatus: string;
  userFound: boolean;
  userReady: boolean;
  verificationRequired: boolean;
  pendingApproval: boolean;
  userData: SignupData | undefined;
  loading: boolean;
  refetchUserData: () => Promise<SignupData | undefined>;
  signupUser: () => void;
  refetchAAP: () => void;
  ansibleData: AAPData | undefined;
  ansibleUIUser: string | undefined;
  ansibleUIPassword: string;
  ansibleUILink: string | undefined;
  ansibleError: string | null;
  ansibleStatus: AnsibleStatus;
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

export const useSandboxContext = (): SandboxContextType => {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error('Context useSandboxContext is not defined');
  }
  return context;
};

export const SandboxProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useRecaptcha();
  const aapApi = useApi(aapApiRef);
  const kubeApi = useApi(kubeApiRef);
  const registerApi = useApi(registerApiRef);

  const [statusUnknown, setStatusUnknown] = React.useState(true);
  const [userFound, setUserFound] = useState<boolean>(false);
  const [userData, setData] = useState<SignupData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [userReady, setUserReady] = useState<boolean>(false);
  const [verificationRequired, setVerificationRequired] =
    useState<boolean>(false);
  const [pendingApproval, setPendingApproval] = useState<boolean>(false);

  const [ansibleData, setAnsibleData] = React.useState<AAPData | undefined>();
  const [ansibleUILink, setAnsibleUILink] = React.useState<
    string | undefined
  >();
  const [ansibleUIUser, setAnsibleUIUser] = React.useState<string>();
  const [ansibleUIPassword, setAnsibleUIPassword] = React.useState<string>('');
  const [ansibleStatus, setAnsibleStatus] = React.useState<AnsibleStatus>(
    AnsibleStatus.NEW,
  );
  const [ansibleError, setAnsibleError] = useState<string | null>(null);

  const status = React.useMemo(
    () => (statusUnknown ? 'unknown' : signupDataToStatus(userData)),
    [statusUnknown, userData],
  );

  useEffect(() => {
    setVerificationRequired(status === 'verify');
    setPendingApproval(status === 'pending-approval');
    setUserReady(status === 'ready');
  }, [status]);

  const fetchData = async (
    isRefetch = false,
  ): Promise<SignupData | undefined> => {
    if (!isRefetch) {
      setLoading(true);
    }

    let result;
    try {
      result = await registerApi.getSignUpData();
      if (!isEqual(userData, result)) {
        setData(result);
      }
      if (result) {
        setUserFound(true);
      } else {
        setUserFound(false);
      }
    } catch (err) {
      /* eslint-disable no-console */
      console.error('Error fetching user data:', err);
      /* eslint-enable no-console */
      setData(undefined);
      setUserFound(false);
    } finally {
      setLoading(false);
      setStatusUnknown(false);
    }
    return result;
  };

  const signupUser = async () => {
    setLoading(true);
    try {
      await registerApi.signup();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error during signup', err);
    } finally {
      setLoading(false);
    }
  };

  const getAAPData = async () => {
    try {
      const data = await aapApi.getAAP(userData?.defaultUserNamespace ?? '');
      setAnsibleData(data);
      const st = getReadyCondition(data, e => setAnsibleError(errorMessage(e)));
      setAnsibleStatus(st);
      if (data && data?.items?.length > 0 && data?.items[0]?.status) {
        if (data?.items[0]?.status?.URL) {
          setAnsibleUILink(data.items[0].status.URL);
        }
        if (data?.items[0]?.status?.adminUser) {
          setAnsibleUIUser(data?.items[0]?.status?.adminUser);
        }
        if (data?.items[0]?.status?.adminPasswordSecret) {
          const adminSecret = await kubeApi.getSecret(
            userData?.defaultUserNamespace ?? '',
            data?.items[0]?.status?.adminPasswordSecret,
          );
          if (adminSecret?.data) {
            setAnsibleUIPassword(decode(adminSecret?.data?.password));
          }
        }
      }
    } catch (e) {
      setAnsibleError(errorMessage(e));
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userData?.defaultUserNamespace) {
      getAAPData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const pollStatus = userFound && !userReady;
  const pollInterval =
    status === 'provisioning' ? SHORT_INTERVAL : LONG_INTERVAL;

  React.useEffect(() => {
    if (pollStatus) {
      const handle = setInterval(() => {
        fetchData(true);
      }, pollInterval);
      return () => clearInterval(handle);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollStatus, pollInterval]);

  React.useEffect(() => {
    if (
      ansibleStatus === AnsibleStatus.PROVISIONING ||
      ansibleStatus === AnsibleStatus.UNKNOWN
    ) {
      const handle = setInterval(getAAPData, SHORT_INTERVAL);
      return () => {
        clearInterval(handle);
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userReady, ansibleStatus]);

  return (
    <SandboxContext.Provider
      value={{
        userStatus: status,
        userFound,
        userReady,
        verificationRequired,
        pendingApproval,
        userData,
        loading,
        refetchUserData: fetchData,
        signupUser,
        refetchAAP: getAAPData,
        ansibleData,
        ansibleUIUser,
        ansibleUIPassword,
        ansibleUILink,
        ansibleError,
        ansibleStatus,
      }}
    >
      {children}
    </SandboxContext.Provider>
  );
};

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
import {
  identityApiRef,
  useApiHolder,
  type BackstageUserIdentity,
  type ProfileInfo,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import type { UserEntity } from '@backstage/catalog-model';

/**
 * Hook to retrieve user profile and identity safely without a hard dependency
 * on catalogApiRef, allowing homepage widgets to work even when the catalog
 * plugin is disabled or decoupled.
 *
 * @internal
 */
export function useUserIdentity() {
  const apiHolder = useApiHolder();
  const identityApi = apiHolder.get(identityApiRef);
  const catalogApi = apiHolder.get(catalogApiRef);

  const [profile, setProfile] = useState<ProfileInfo>({});
  const [backstageIdentity, setBackstageIdentity] =
    useState<BackstageUserIdentity>();
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (!identityApi) {
          if (mounted) setLoading(false);
          return;
        }

        const profileInfo = await identityApi
          .getProfileInfo()
          .catch(() => ({} as ProfileInfo));
        const identity = await identityApi
          .getBackstageIdentity()
          .catch(() => undefined);

        if (!mounted) return;

        let activeProfile: ProfileInfo = profileInfo ?? {};
        let activeDisplayName =
          activeProfile.displayName ?? identity?.userEntityRef ?? '';

        if (identity?.userEntityRef && catalogApi) {
          try {
            const userEntity = (await catalogApi.getEntityByRef(
              identity.userEntityRef,
            )) as unknown as UserEntity;

            if (mounted && userEntity) {
              const catalogName =
                userEntity.spec?.profile?.displayName ??
                userEntity.metadata?.title;
              if (catalogName) {
                activeDisplayName = catalogName;
              }
              if (!activeProfile.picture && userEntity.spec?.profile?.picture) {
                activeProfile = {
                  ...activeProfile,
                  picture: userEntity.spec.profile.picture,
                };
              }
            }
          } catch {
            // catalog lookup failed or not found, keep profileInfo
          }
        }

        if (mounted) {
          setProfile(activeProfile);
          setBackstageIdentity(identity);
          setDisplayName(activeDisplayName);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [identityApi, catalogApi]);

  return {
    profile,
    backstageIdentity,
    displayName,
    loading,
  };
}

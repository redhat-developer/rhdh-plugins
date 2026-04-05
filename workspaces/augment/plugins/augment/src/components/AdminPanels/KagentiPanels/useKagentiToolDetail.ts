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

import { useCallback, useEffect, useState } from 'react';
import type {
  KagentiBuildInfo,
  KagentiRouteStatus,
  KagentiToolDetail,
  KagentiToolSummary,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AugmentApi } from '../../../api';
import { getErrorMessage } from '../../../utils';

export function useKagentiToolDetail(
  open: boolean,
  tool: KagentiToolSummary | null,
  api: AugmentApi,
) {
  const [detail, setDetail] = useState<KagentiToolDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [routeStatus, setRouteStatus] = useState<KagentiRouteStatus | null>(
    null,
  );
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [buildInfo, setBuildInfo] = useState<KagentiBuildInfo | null>(null);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildFetchFailed, setBuildFetchFailed] = useState(false);

  const [triggeringBuild, setTriggeringBuild] = useState(false);
  const [finalizingBuild, setFinalizingBuild] = useState(false);
  const [buildActionError, setBuildActionError] = useState<string | null>(null);

  const refreshBuildInfo = useCallback(async () => {
    if (!tool) return;
    setBuildLoading(true);
    setBuildFetchFailed(false);
    try {
      const info = await api.getToolBuildInfo(tool.namespace, tool.name);
      setBuildInfo(info);
    } catch {
      setBuildInfo(null);
      setBuildFetchFailed(true);
    } finally {
      setBuildLoading(false);
    }
  }, [api, tool]);

  useEffect(() => {
    if (!open || !tool) {
      setDetail(null);
      setDetailLoading(false);
      setDetailError(null);
      return () => {};
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    api
      .getKagentiTool(tool.namespace, tool.name)
      .then(d => {
        if (!cancelled) setDetail(d);
      })
      .catch(e => {
        if (!cancelled) setDetailError(getErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tool, api]);

  useEffect(() => {
    if (!open || !tool) {
      setRouteStatus(null);
      setRouteLoading(false);
      setRouteError(null);
      return () => {};
    }
    let cancelled = false;
    setRouteLoading(true);
    setRouteError(null);
    api
      .getToolRouteStatus(tool.namespace, tool.name)
      .then(rs => {
        if (!cancelled) setRouteStatus(rs);
      })
      .catch(e => {
        if (!cancelled) setRouteError(getErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tool, api]);

  useEffect(() => {
    if (!open || !tool) {
      setBuildInfo(null);
      setBuildLoading(false);
      setBuildFetchFailed(false);
      return () => {};
    }
    let cancelled = false;
    setBuildLoading(true);
    setBuildFetchFailed(false);
    api
      .getToolBuildInfo(tool.namespace, tool.name)
      .then(info => {
        if (!cancelled) setBuildInfo(info);
      })
      .catch(() => {
        if (!cancelled) {
          setBuildInfo(null);
          setBuildFetchFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setBuildLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tool, api]);

  useEffect(() => {
    if (!open || !tool) {
      setBuildActionError(null);
    }
  }, [open, tool]);

  const handleTriggerBuild = useCallback(async () => {
    if (!tool) return;
    setTriggeringBuild(true);
    setBuildActionError(null);
    try {
      await api.triggerToolBuild(tool.namespace, tool.name);
      await refreshBuildInfo();
    } catch (e) {
      setBuildActionError(getErrorMessage(e));
    } finally {
      setTriggeringBuild(false);
    }
  }, [api, tool, refreshBuildInfo]);

  const handleFinalizeBuild = useCallback(async () => {
    if (!tool) return;
    setFinalizingBuild(true);
    setBuildActionError(null);
    try {
      await api.finalizeToolBuild(tool.namespace, tool.name);
      await refreshBuildInfo();
    } catch (e) {
      setBuildActionError(getErrorMessage(e));
    } finally {
      setFinalizingBuild(false);
    }
  }, [api, tool, refreshBuildInfo]);

  return {
    detail,
    detailLoading,
    detailError,
    routeStatus,
    routeLoading,
    routeError,
    buildInfo,
    buildLoading,
    buildFetchFailed,
    triggeringBuild,
    finalizingBuild,
    buildActionError,
    setBuildActionError,
    refreshBuildInfo,
    handleTriggerBuild,
    handleFinalizeBuild,
  };
}

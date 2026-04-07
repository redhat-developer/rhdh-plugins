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

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  KagentiAgentCard,
  KagentiAgentDetail,
  KagentiAgentSummary,
  KagentiBuildInfo,
  KagentiRouteStatus,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AugmentApi } from '../../../api';
import { getErrorMessage } from '../../../utils';

const STATUS_POLL_INTERVAL_MS = 15000;

export function useKagentiAgentDetail(
  api: AugmentApi,
  agent: KagentiAgentSummary,
) {
  const [agentCard, setAgentCard] = useState<KagentiAgentCard | null>(null);
  const [agentDetail, setAgentDetail] = useState<
    (KagentiAgentDetail & { agentCard?: KagentiAgentCard }) | null
  >(null);
  const [buildInfo, setBuildInfo] = useState<KagentiBuildInfo | null>(null);
  const [routeStatus, setRouteStatus] = useState<KagentiRouteStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildTriggering, setBuildTriggering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasBuild, setHasBuild] = useState<boolean | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await api.getKagentiAgent(agent.namespace, agent.name);
      setAgentDetail(detail);
      if (detail.agentCard) setAgentCard(detail.agentCard);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [api, agent.namespace, agent.name]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const loadBuildInfo = useCallback(async () => {
    try {
      const info = await api.getKagentiBuildInfo(agent.namespace, agent.name);
      setBuildInfo(info);
      setHasBuild(true);
    } catch {
      setHasBuild(false);
    }
  }, [api, agent.namespace, agent.name]);

  const loadRouteStatus = useCallback(async () => {
    try {
      const rs = await api.getKagentiAgentRouteStatus(
        agent.namespace,
        agent.name,
      );
      setRouteStatus(rs);
    } catch {
      /* optional */
    }
  }, [api, agent.namespace, agent.name]);

  useEffect(() => {
    void loadBuildInfo();
    void loadRouteStatus();
  }, [loadBuildInfo, loadRouteStatus]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      void loadDetail();
      if (hasBuild) void loadBuildInfo();
    }, STATUS_POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadDetail, loadBuildInfo, hasBuild]);

  const handleTriggerBuild = useCallback(async () => {
    setBuildTriggering(true);
    try {
      await api.triggerKagentiBuild(agent.namespace, agent.name);
      await loadBuildInfo();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBuildTriggering(false);
    }
  }, [api, agent.namespace, agent.name, loadBuildInfo]);

  const handleCopy = useCallback((text: string) => {
    void window.navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  return {
    agentCard,
    agentDetail,
    buildInfo,
    routeStatus,
    loading,
    error,
    setError,
    buildTriggering,
    copied,
    hasBuild,
    loadDetail,
    loadBuildInfo,
    loadRouteStatus,
    handleTriggerBuild,
    handleCopy,
  };
}

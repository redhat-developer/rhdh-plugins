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

import { useCallback, useState } from 'react';
import type { KagentiToolSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AugmentApi } from '../../../api';
import { getErrorMessage } from '../../../utils';

export interface UseToolInvokeResult {
  invokeOpen: boolean;
  setInvokeOpen: (open: boolean) => void;
  invokeTarget: KagentiToolSummary | null;
  invokeToolName: string;
  setInvokeToolName: (v: string) => void;
  invokeArgsJson: string;
  setInvokeArgsJson: (v: string) => void;
  invokeResult: string | null;
  setInvokeResult: (v: string | null) => void;
  invokeError: string | null;
  setInvokeError: (v: string | null) => void;
  invoking: boolean;
  invokeSchema: Record<string, unknown> | undefined;
  handleStartInvoke: (name: string, schema?: Record<string, unknown>) => void;
  openInvoke: (target: KagentiToolSummary) => void;
  openInvokePrefilled: (
    target: KagentiToolSummary,
    toolName: string,
    inputSchema?: Record<string, unknown>,
  ) => void;
  clearInvokeError: () => void;
  handleInvoke: (ns: string, name: string) => Promise<void>;
  invokeWithArgs: (
    ns: string,
    resourceName: string,
    mcpToolName: string,
    args: Record<string, unknown>,
  ) => Promise<void>;
  resetInvoke: () => void;
}

export function useToolInvoke(api: AugmentApi): UseToolInvokeResult {
  const [invokeOpen, setInvokeOpen] = useState(false);
  const [invokeTarget, setInvokeTarget] = useState<KagentiToolSummary | null>(
    null,
  );
  const [invokeToolName, setInvokeToolName] = useState('');
  const [invokeArgsJson, setInvokeArgsJson] = useState('{}');
  const [invokeResult, setInvokeResult] = useState<string | null>(null);
  const [invokeError, setInvokeError] = useState<string | null>(null);
  const [invoking, setInvoking] = useState(false);
  const [invokeSchema, setInvokeSchema] = useState<
    Record<string, unknown> | undefined
  >(undefined);

  const resetInvoke = useCallback(() => {
    setInvokeOpen(false);
    setInvokeTarget(null);
    setInvokeToolName('');
    setInvokeArgsJson('{}');
    setInvokeResult(null);
    setInvokeError(null);
    setInvokeSchema(undefined);
    setInvoking(false);
  }, []);

  const clearInvokeError = useCallback(() => setInvokeError(null), []);

  const handleStartInvoke = useCallback(
    (name: string, schema?: Record<string, unknown>) => {
      setInvokeToolName(name);
      setInvokeArgsJson('{}');
      setInvokeResult(null);
      setInvokeError(null);
      setInvokeSchema(schema);
      setInvokeOpen(true);
    },
    [],
  );

  const openInvoke = useCallback((target: KagentiToolSummary) => {
    setInvokeTarget(target);
    setInvokeToolName('');
    setInvokeArgsJson('{}');
    setInvokeResult(null);
    setInvokeError(null);
    setInvokeSchema(undefined);
    setInvokeOpen(true);
  }, []);

  const openInvokePrefilled = useCallback(
    (
      target: KagentiToolSummary,
      toolName: string,
      inputSchema?: Record<string, unknown>,
    ) => {
      setInvokeTarget(target);
      setInvokeToolName(toolName);
      setInvokeArgsJson('{}');
      setInvokeResult(null);
      setInvokeError(null);
      setInvokeSchema(inputSchema);
      setInvokeOpen(true);
    },
    [],
  );

  const handleInvoke = useCallback(
    async (ns: string, name: string) => {
      if (!invokeToolName.trim()) return;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(invokeArgsJson || '{}') as Record<string, unknown>;
      } catch {
        setInvokeError('Arguments must be valid JSON');
        return;
      }
      setInvoking(true);
      setInvokeError(null);
      try {
        const res = await api.invokeKagentiTool(
          ns,
          name,
          invokeToolName.trim(),
          args,
        );
        setInvokeResult(JSON.stringify(res, null, 2));
      } catch (e) {
        setInvokeError(getErrorMessage(e));
      } finally {
        setInvoking(false);
      }
    },
    [api, invokeToolName, invokeArgsJson],
  );

  const invokeWithArgs = useCallback(
    async (
      ns: string,
      resourceName: string,
      mcpToolName: string,
      args: Record<string, unknown>,
    ) => {
      setInvoking(true);
      setInvokeError(null);
      try {
        const res = await api.invokeKagentiTool(
          ns,
          resourceName,
          mcpToolName.trim(),
          args,
        );
        setInvokeResult(JSON.stringify(res, null, 2));
      } catch (e) {
        setInvokeError(getErrorMessage(e));
      } finally {
        setInvoking(false);
      }
    },
    [api],
  );

  return {
    invokeOpen,
    setInvokeOpen,
    invokeTarget,
    invokeToolName,
    setInvokeToolName,
    invokeArgsJson,
    setInvokeArgsJson,
    invokeResult,
    setInvokeResult,
    invokeError,
    setInvokeError,
    invoking,
    invokeSchema,
    handleStartInvoke,
    openInvoke,
    openInvokePrefilled,
    clearInvokeError,
    handleInvoke,
    invokeWithArgs,
    resetInvoke,
  };
}

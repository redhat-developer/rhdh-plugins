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
import { useEffect, useRef, useState } from 'react';
import { POLLING_INTERVAL_MS } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { readPlainTextResponseStream } from '../components/phaseLogStream';

export interface UseLogStreamResult {
  logText?: string;
  logStreamHasData: boolean;
  logLoading: boolean;
  logError?: Error;
}

/**
 * Streams plain-text logs from the backend into React state.
 *
 * The caller provides a `fetchLog` callback that returns a `Response`.
 * The hook reads its body as a stream, appending chunks to `logText`.
 * When `enabled` flips to `false` (or on unmount), the stream is aborted.
 */
export function useLogStream(params: {
  enabled: boolean;
  phaseId?: string;
  phaseStatus?: string;
  projectId: string;
  moduleId?: string;
  phaseName: string;
  fetchLog: () => Promise<Response>;
}): UseLogStreamResult {
  const {
    enabled,
    phaseId,
    phaseStatus,
    projectId,
    moduleId,
    phaseName,
    fetchLog,
  } = params;

  const fetchRef = useRef(fetchLog);
  fetchRef.current = fetchLog;

  const phaseStatusRef = useRef(phaseStatus);
  phaseStatusRef.current = phaseStatus;

  const [logText, setLogText] = useState<string | undefined>(undefined);
  const [logStreamHasData, setLogStreamHasData] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<Error | undefined>(undefined);
  const [retryCounter, setRetryCounter] = useState(0);

  useEffect(() => {
    if (!enabled || !phaseId) {
      setLogText(undefined);
      setLogStreamHasData(false);
      setLogError(undefined);
      setLogLoading(false);
      return undefined;
    }

    const ac = new AbortController();
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    let receivedData = false;
    let hadError = false;

    setLogText('');
    setLogStreamHasData(false);
    setLogError(undefined);
    setLogLoading(true);

    (async () => {
      try {
        const response = await fetchRef.current();
        if (cancelled) {
          return;
        }
        await readPlainTextResponseStream(response, {
          signal: ac.signal,
          onChunk: chunk => {
            if (cancelled) {
              return;
            }
            receivedData = true;
            setLogStreamHasData(true);
            setLogText(prev => (prev ?? '') + chunk);
          },
        });
      } catch (e) {
        if (
          cancelled ||
          (e instanceof DOMException && e.name === 'AbortError') ||
          ac.signal.aborted
        ) {
          return;
        }
        hadError = true;
        setLogError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled && !ac.signal.aborted) {
          if (
            !receivedData &&
            !hadError &&
            phaseStatusRef.current === 'running'
          ) {
            retryTimeout = setTimeout(() => {
              if (!cancelled) {
                setRetryCounter(prev => prev + 1);
              }
            }, POLLING_INTERVAL_MS);
          } else {
            setLogLoading(false);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
      if (retryTimeout !== undefined) clearTimeout(retryTimeout);
    };
  }, [enabled, phaseId, projectId, moduleId, phaseName, retryCounter]);

  return { logText, logStreamHasData, logLoading, logError };
}

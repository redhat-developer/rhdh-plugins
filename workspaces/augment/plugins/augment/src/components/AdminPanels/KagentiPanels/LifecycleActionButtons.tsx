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

import { useCallback } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import PublishIcon from '@mui/icons-material/Publish';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { borderRadius } from '../../../theme/tokens';

const actionBtnSx = {
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '0.8rem',
  borderRadius: borderRadius.sm,
};

export interface LifecycleActionButtonsProps {
  readonly lifecycleStage: string;
  readonly isAdmin: boolean;
  readonly loading: boolean;
  readonly onSubmitForReview: () => void;
  readonly onWithdraw: () => void;
  readonly onReactivate: () => void;
}

export interface UseLifecycleActionOptions {
  api: {
    promoteAgent(
      agentId: string,
      target?: string,
    ): Promise<{ lifecycleStage: string; version?: number }>;
    demoteAgent(
      agentId: string,
      target?: string,
    ): Promise<{ lifecycleStage: string }>;
  };
  agentId: string;
  action: 'promote' | 'demote';
  target: string;
  setLoading: (v: boolean) => void;
  setToast: (msg: string) => void;
  onStageChange: (stage: string) => void;
}

export function useLifecycleAction({
  api,
  agentId,
  action,
  target,
  setLoading,
  setToast,
  onStageChange,
}: UseLifecycleActionOptions) {
  const handleAction = useCallback(async () => {
    setLoading(true);
    try {
      if (action === 'demote') {
        const result = await api.demoteAgent(agentId, target);
        onStageChange(result.lifecycleStage);
        setToast(`Agent moved to ${result.lifecycleStage}`);
      } else {
        const result = await api.promoteAgent(agentId, target);
        onStageChange(result.lifecycleStage);
        setToast(
          `Agent moved to ${result.lifecycleStage} (v${result.version})`,
        );
      }
    } catch (err) {
      setToast(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [api, agentId, action, target, setLoading, setToast, onStageChange]);

  return { handleAction };
}

export interface UseWithdrawOptions {
  api: { withdrawAgent(agentId: string): Promise<void> };
  agentId: string;
  onSuccess: () => void;
  setToast: (msg: string) => void;
  setLoading: (v: boolean) => void;
}

export function useWithdrawHandler({
  api,
  agentId,
  onSuccess,
  setToast,
  setLoading,
}: UseWithdrawOptions) {
  const handleWithdraw = useCallback(async () => {
    setLoading(true);
    try {
      await api.withdrawAgent(agentId);
      onSuccess();
      setToast('Agent withdrawn to draft');
    } catch (err) {
      setToast(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [api, agentId, onSuccess, setToast, setLoading]);

  return { handleWithdraw };
}

export function LifecycleActionButtons({
  lifecycleStage,
  isAdmin,
  loading,
  onSubmitForReview,
  onWithdraw,
  onReactivate,
}: LifecycleActionButtonsProps) {
  return (
    <>
      {lifecycleStage === 'draft' && (
        <Tooltip title="Submit this agent for admin review">
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={
              loading ? <CircularProgress size={14} /> : <PublishIcon />
            }
            disabled={loading}
            onClick={onSubmitForReview}
            sx={actionBtnSx}
          >
            Submit for Review
          </Button>
        </Tooltip>
      )}
      {lifecycleStage === 'pending' && (
        <Tooltip title="Withdraw this agent back to draft">
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={
              loading ? <CircularProgress size={14} /> : <CloudOffIcon />
            }
            disabled={loading}
            onClick={onWithdraw}
            sx={actionBtnSx}
          >
            Withdraw
          </Button>
        </Tooltip>
      )}
      {lifecycleStage === 'published' && (
        <Chip
          label="Published"
          size="small"
          color="success"
          sx={{ fontWeight: 600 }}
        />
      )}
      {lifecycleStage === 'archived' && isAdmin && (
        <Tooltip title="Reactivate this agent to draft status">
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={
              loading ? <CircularProgress size={14} /> : <PublishIcon />
            }
            disabled={loading}
            onClick={onReactivate}
            sx={actionBtnSx}
          >
            Reactivate
          </Button>
        </Tooltip>
      )}
    </>
  );
}

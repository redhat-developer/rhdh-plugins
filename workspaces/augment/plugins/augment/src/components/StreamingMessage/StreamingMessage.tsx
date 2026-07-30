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

/**
 * StreamingMessage Component
 *
 * Displays real-time streaming responses from the AI agent,
 * including tool calls, RAG results, and generated text.
 *
 * All colors are derived from branding configuration for enterprise customization.
 */

import { useMemo, useState, useRef, useEffect, memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BotAvatarIcon } from '../icons';
import { useTheme } from '@mui/material/styles';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { typeScale } from '../../theme/tokens';
import { useBranding } from '../../hooks/useBranding';
import { useChatViewMode } from '../../hooks/useChatViewMode';
import { InlineCode, PreBlock } from '../CodeBlock';
import type { BrandingConfig } from '../../types';
import { ReasoningDisplay } from './ReasoningDisplay';
import { sanitizeResponseText, formatResponseText } from '../../utils';
import { HandoffDivider } from '../HandoffDivider';
import { StreamingState } from './StreamingMessage.types';
import {
  STREAMING_PHASES,
  PHASE_LABELS,
  PHASE_COLOR_KEYS,
  DEFAULT_PHASE_LABEL,
  DEFAULT_PHASE_COLOR_KEY,
} from './StreamingMessage.constants';
import {
  getContainerSx,
  getAvatarSx,
  getContentContainerSx,
  getMarkdownContentSx,
  getTypingCursorSx,
  StatusColors,
} from './styles';
import {
  ToolCallDisplay,
  RAGSearchDisplay,
  CompactToolCallDisplay,
  CompactRAGDisplay,
} from './ToolCallDisplay';
import { PhaseChip, LoadingIndicator } from './StreamingProgress';
import { FormRequestCard } from './FormRequestCard';
import { AuthRequiredCard } from './AuthRequiredCard';
import { ArtifactRenderer } from './ArtifactRenderer';
import { CitationRenderer } from './CitationRenderer';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets the color for a phase from branding
 */
function getPhaseColor(phase: string, branding: BrandingConfig): string {
  const colorKey = PHASE_COLOR_KEYS[phase] || DEFAULT_PHASE_COLOR_KEY;
  return branding[colorKey];
}

const REMARK_PLUGINS = [remarkGfm, remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];

const ScrollableTable = (props: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="table-scroll-wrapper">
    <table {...props} />
  </div>
);

const MARKDOWN_COMPONENTS: Components = {
  code: InlineCode as Components['code'],
  pre: PreBlock as Components['pre'],
  table: ScrollableTable as Components['table'],
};

// =============================================================================
// MEMOIZED MARKDOWN BODY
// =============================================================================

const MARKDOWN_DEBOUNCE_MS = 150;

interface MarkdownBodyProps {
  text: string;
  completed: boolean;
}

/**
 * Debounces expensive markdown re-parses during active streaming.
 * When completed, renders immediately with the final text.
 */
const MarkdownBody = memo(function MarkdownBody({
  text,
  completed,
}: MarkdownBodyProps) {
  const [renderedText, setRenderedText] = useState(text);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (completed) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setRenderedText(text);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setRenderedText(text);
    }, MARKDOWN_DEBOUNCE_MS);

    // eslint-disable-next-line consistent-return
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, completed]);

  const formatted = useMemo(
    () => formatResponseText(sanitizeResponseText(renderedText)),
    [renderedText],
  );

  return (
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS}
      components={MARKDOWN_COMPONENTS}
    >
      {formatted}
    </ReactMarkdown>
  );
});

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface StreamingMessageProps {
  state: StreamingState;
  onFormSubmit?: (values: Record<string, unknown>) => void;
  onFormCancel?: () => void;
  onAuthConfirm?: () => void;
  onSecretsSubmit?: (secrets: Record<string, string>) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * StreamingMessage - Displays real-time streaming responses
 *
 * Features:
 * - Animated avatar with phase-based colors (from branding)
 * - RAG search activity display
 * - MCP tool call tracking with arguments and output
 * - Markdown rendering for generated text
 * - Loading states with animated dots
 * - All colors from branding for enterprise customization
 */
export const StreamingMessage: React.FC<StreamingMessageProps> = memo(
  function StreamingMessage({
    state,
    onFormSubmit,
    onFormCancel,
    onAuthConfirm,
    onSecretsSubmit,
  }) {
    const theme = useTheme();
    const { branding } = useBranding();
    const { isDev } = useChatViewMode();

    // Get phase info from branding colors
    const phaseLabel = PHASE_LABELS[state.phase] || DEFAULT_PHASE_LABEL;
    const phaseColor = getPhaseColor(state.phase, branding);

    const statusColors: StatusColors = useMemo(
      () => ({
        success: branding.successColor,
        error: branding.errorColor,
        primary: branding.primaryColor,
      }),
      [branding.successColor, branding.errorColor, branding.primaryColor],
    );

    const showRAG =
      state.phase === STREAMING_PHASES.SEARCHING ||
      state.filesSearched.length > 0;
    const hasToolCalls = state.toolCalls.length > 0;
    const hasReasoning = !!state.reasoning;
    const isReasoning = state.phase === STREAMING_PHASES.REASONING;
    // Don't show generic loading if we have reasoning content to show
    const showLoading = !state.text && !state.completed && !hasReasoning;

    // Don't render anything during pending_approval phase with no visible content
    // The ToolApprovalDialog will handle the UI
    const isPendingApproval = state.phase === 'pending_approval';
    const hasPendingForm = state.phase === 'form_input' && !!state.pendingForm;
    const hasPendingAuth =
      state.phase === 'auth_required' && !!state.pendingAuth;
    const hasArtifacts = (state.artifacts?.length ?? 0) > 0;
    const hasCitations = (state.citations?.length ?? 0) > 0;
    const hasVisibleContent =
      showRAG ||
      hasToolCalls ||
      state.text ||
      showLoading ||
      hasReasoning ||
      hasPendingForm ||
      hasPendingAuth ||
      hasArtifacts ||
      hasCitations;
    if (isPendingApproval && !hasVisibleContent) {
      return null;
    }

    const hasHandoffs = state.handoffs.length > 0;

    return (
      <>
        {/* Handoff dividers emitted during this stream */}
        {hasHandoffs &&
          state.handoffs.map((h, i) => (
            <HandoffDivider
              key={`handoff-${i}`}
              agentName={h.to}
              reason={h.reason}
            />
          ))}

        <Box sx={getContainerSx()}>
          {/* Avatar */}
          <Box sx={getAvatarSx(theme, phaseColor, state.completed)}>
            <BotAvatarIcon botAvatarUrl={branding.botAvatarUrl} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: typeScale.bodySmall.fontSize,
                }}
              >
                {state.currentAgent || branding.appName}
              </Typography>
              {isDev && (
                <PhaseChip
                  phaseLabel={phaseLabel}
                  phaseColor={phaseColor}
                  completed={state.completed}
                />
              )}
            </Box>

            {/* Content Container - aria-live for screen reader announcements */}
            <Box
              sx={getContentContainerSx(theme)}
              aria-live="polite"
              aria-atomic="false"
            >
              {/* Model Reasoning/Thinking (if available) */}
              {hasReasoning && (
                <ReasoningDisplay
                  reasoning={state.reasoning!}
                  reasoningDuration={state.reasoningDuration}
                  isStreaming={isReasoning}
                  theme={theme}
                  branding={branding}
                />
              )}

              {/* RAG Search Activity */}
              {showRAG &&
                (isDev ? (
                  <Box sx={{ mb: hasToolCalls || state.text ? 2 : 0 }}>
                    <RAGSearchDisplay
                      filesSearched={state.filesSearched}
                      theme={theme}
                      branding={branding}
                      statusColors={statusColors}
                    />
                  </Box>
                ) : (
                  <CompactRAGDisplay
                    filesSearched={state.filesSearched}
                    theme={theme}
                  />
                ))}

              {/* MCP Tool Activity */}
              {hasToolCalls &&
                (isDev ? (
                  <Box sx={{ mb: state.text ? 2 : 0 }}>
                    {state.toolCalls.map((tc, index) => (
                      <ToolCallDisplay
                        key={tc.id || index}
                        tc={tc}
                        theme={theme}
                        branding={branding}
                        statusColors={statusColors}
                      />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ mb: state.text ? 1 : 0 }}>
                    {state.toolCalls.map((tc, index) => (
                      <CompactToolCallDisplay
                        key={tc.id || index}
                        tc={tc}
                        theme={theme}
                        branding={branding}
                      />
                    ))}
                  </Box>
                ))}

              {/* Text Content with Markdown */}
              {state.text && (
                <Box sx={getMarkdownContentSx(theme)}>
                  <MarkdownBody text={state.text} completed={state.completed} />
                  {!state.completed && (
                    <Box component="span" sx={getTypingCursorSx()} />
                  )}
                </Box>
              )}

              {/* Form Input Request (A2A) */}
              {state.phase === 'form_input' && state.pendingForm && (
                <FormRequestCard
                  form={state.pendingForm.form}
                  onSubmit={onFormSubmit}
                  onCancel={onFormCancel}
                />
              )}

              {/* Auth Required (A2A) */}
              {state.phase === 'auth_required' && state.pendingAuth && (
                <AuthRequiredCard
                  authType={state.pendingAuth.authType}
                  url={state.pendingAuth.url}
                  demands={state.pendingAuth.demands}
                  onOAuthConfirm={onAuthConfirm}
                  onSecretsSubmit={onSecretsSubmit}
                />
              )}

              {/* Artifacts */}
              {state.artifacts && state.artifacts.length > 0 && (
                <ArtifactRenderer artifacts={state.artifacts} />
              )}

              {/* Citations */}
              {state.citations && state.citations.length > 0 && (
                <CitationRenderer citations={state.citations} />
              )}

              {/* Loading state */}
              {showLoading && (
                <LoadingIndicator phase={state.phase} phaseColor={phaseColor} />
              )}
            </Box>
          </Box>
        </Box>
      </>
    );
  },
);

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
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { MessageProps } from '@patternfly/chatbot';
import { UserFeedbackProps } from '@patternfly/chatbot/dist/cjs/Message/UserFeedback/UserFeedback';
import { UserFeedbackCompleteProps } from '@patternfly/chatbot/dist/cjs/Message/UserFeedback/UserFeedbackComplete';

import { useCaptureFeedback } from '../hooks/useCaptureFeedback';
import { CaptureFeedback } from '../types';
import { Sentiment, useFeedbackState } from './useFeedbackState';
import { useFeedbackStatus } from './useFeedbackStatus';
import { useTranslation } from './useTranslation';

export const useFeedbackActions = <T extends MessageProps>(
  messages: T[],
  conversationId: string,
  isStreaming: boolean,
): T[] => {
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const speakingButtonRef = useRef<HTMLButtonElement>(null);
  const currentSpeakingIdRef = useRef<string | null>(null);

  const { data: feedbackEnabled } = useFeedbackStatus();
  const { state, ...dispatch } = useFeedbackState();
  const { mutateAsync: captureFeedback } = useCaptureFeedback();
  const { t } = useTranslation();

  const createQuickResponses = useMemo(
    () => ({
      positive: [
        { id: '1', content: t('feedback.quickResponses.positive.helpful') },
        {
          id: '2',
          content: t('feedback.quickResponses.positive.easyToUnderstand'),
        },
        {
          id: '3',
          content: t('feedback.quickResponses.positive.resolvedIssue'),
        },
      ],
      negative: [
        { id: '1', content: t('feedback.quickResponses.negative.didntAnswer') },
        {
          id: '2',
          content: t('feedback.quickResponses.negative.hardToUnderstand'),
        },
        { id: '3', content: t('feedback.quickResponses.negative.notHelpful') },
      ],
    }),
    [t],
  );

  const getFeedbackForm = useCallback(
    (messageId: string, sentiment: 'positive' | 'negative') => ({
      key: `feedback-${sentiment}`,
      id: `feedback-${sentiment}-${messageId}`,
      hasTextArea: true,
      title: t('feedback.form.title'),
      textAreaPlaceholder: t('feedback.form.textAreaPlaceholder'),
      submitWord: t('feedback.form.submitWord'),
      quickResponses: createQuickResponses[sentiment],
      onSubmit: (
        quickResponse: string | undefined = '0',
        additionalFeedback: string | undefined,
      ) => {
        const quickIndex = Number(quickResponse) - 1;
        const quickText =
          quickResponse !== '0'
            ? createQuickResponses[sentiment]?.[quickIndex]?.content
            : undefined;

        let user_feedback = '';

        if (quickText && additionalFeedback) {
          user_feedback = `${quickText}\nAdditional feedback: ${additionalFeedback}`;
        } else if (quickText) {
          user_feedback = quickText;
        } else if (additionalFeedback) {
          user_feedback = additionalFeedback;
        }

        const botAnswerId = Number(messageId.split('-').pop());
        const userQuestionId = botAnswerId - 1;

        const payload: CaptureFeedback = {
          conversation_id: conversationId,
          user_feedback,
          sentiment: sentiment === 'positive' ? 1 : -1,
          user_question: messages[userQuestionId].content || '',
          llm_response: messages[botAnswerId].content || '',
        };

        captureFeedback(payload).then(() => {
          dispatch.hideFeedbackForm(messageId, sentiment);
          dispatch.showCompletionForm(messageId, sentiment);
          dispatch.updateButtonState(messageId, {
            sentiment: sentiment,
            feedbackSubmitted: true,
          });

          setTimeout(() => {
            dispatch.hideCompletionForm(messageId, sentiment);
          }, 1000);
        });
      },

      // eslint-disable-next-line no-console
      onClose: () => {
        dispatch.hideFeedbackForm(messageId, sentiment);
        dispatch.resetButtonState(messageId);
        dispatch.updateButtonState(messageId, { sentiment: undefined });
      },
      focusOnLoad: true,
    }),
    [
      captureFeedback,
      conversationId,
      dispatch,
      messages,
      createQuickResponses,
      t,
    ],
  );

  const feedbackForms = useCallback(
    (messageId: string): { [key in Sentiment]: UserFeedbackProps } => ({
      positive: getFeedbackForm(messageId, 'positive'),
      negative: getFeedbackForm(messageId, 'negative'),
    }),
    [getFeedbackForm],
  );

  const getUserFeedbackComplete = useCallback(
    (
      messageId: string,
      sentiment: Sentiment,
    ): UserFeedbackCompleteProps | undefined => {
      const isVisible = state[messageId]?.completionForm?.[sentiment];
      if (!isVisible) return undefined;

      return {
        id: `feebback-completion-${sentiment}-${messageId}`,
        title: t('feedback.completion.title'),
        body: t('feedback.completion.body'),
        onClose: () => {
          dispatch.hideCompletionForm(messageId, sentiment);
          dispatch.resetButtonState(messageId);
        },
      };
    },
    [state, dispatch, t],
  );

  const scrollToFeedbackForm = useCallback(
    (messageId: string, sentiment: Sentiment) => {
      setTimeout(() => {
        const el = document.getElementById(
          `feedback-${sentiment}-${messageId}`,
        );
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
          el.focus();
        }
      }, 0);
    },
    [],
  );

  const speakMessage = useCallback(
    (messageId: string, content: string) => {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();

        if (
          currentSpeakingIdRef.current &&
          currentSpeakingIdRef.current !== messageId
        ) {
          dispatch.updateButtonState(currentSpeakingIdRef.current, {
            isSpeaking: false,
          });
        }
      }

      // Track the current SpeakingId
      currentSpeakingIdRef.current = messageId;

      const utterance = new SpeechSynthesisUtterance(content);

      utterance.onstart = () => {
        dispatch.updateButtonState(messageId, { isSpeaking: true });
      };

      utterance.onend = () => {
        dispatch.updateButtonState(messageId, { isSpeaking: false });
        currentSpeakingIdRef.current = null;
      };

      utterance.onerror = () => {
        dispatch.updateButtonState(messageId, { isSpeaking: false });
        currentSpeakingIdRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
    },
    [dispatch],
  );

  const cancelSpeaking = useCallback(
    (messageId?: string) => {
      window.speechSynthesis.cancel();

      currentSpeakingIdRef.current = null;

      if (messageId) {
        // Cancel just this one message
        dispatch.updateButtonState(messageId, { isSpeaking: false });
      } else {
        // Cancel all messages
        Object.keys(state).forEach(id => {
          if (state[id].buttonState?.isSpeaking) {
            dispatch.updateButtonState(id, { isSpeaking: false });
          }
        });
      }
      setTimeout(() => {
        const el = document.getElementById(`listen-${messageId}`);
        if (el) {
          el.blur();
        }
      }, 10);
    },
    [state, dispatch],
  );

  useEffect(() => {
    return () => {
      // Stop any ongoing speech when component unmounts
      cancelSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return useMemo(() => {
    return feedbackEnabled
      ? messages.map((message, index) => {
          if (
            message.role === 'user' ||
            (isStreaming && messages.length - 1 === index)
          )
            return message;

          const messageId = `${conversationId}-${message.role}-${index}`;
          const { sentiment, copied, isSpeaking } =
            state[messageId]?.buttonState || {};
          const showFeedbackForm = state[messageId]?.feedbackForm?.[sentiment];
          const userFeedbackForm =
            showFeedbackForm && feedbackForms(messageId)[sentiment];

          const userFeedbackComplete = getUserFeedbackComplete(
            messageId,
            sentiment,
          );

          const createSentimentAction = (selected: Sentiment) => ({
            isClicked: sentiment === selected,
            onClick: () => {
              if (sentiment !== selected) {
                dispatch.toggleFeedbackForm(messageId, selected);
                dispatch.updateButtonState(messageId, { sentiment: selected });
                scrollToFeedbackForm(messageId, sentiment);
              }
            },
            tooltipContent:
              selected === 'positive'
                ? t('feedback.tooltips.goodResponse')
                : t('feedback.tooltips.badResponse'),
            'aria-expanded': sentiment === selected,
            'aria-controls': showFeedbackForm
              ? `feedback-${sentiment}-${messageId}`
              : `feebback-completion-${sentiment}-${messageId}`,
          });

          const copyAction = {
            isClicked: copied,
            ref: copyButtonRef,
            tooltipContent: copied
              ? t('feedback.tooltips.copied')
              : t('feedback.tooltips.copy'),
            onClick: async () => {
              await window.navigator.clipboard.writeText(
                message.content as string,
              );
              dispatch.updateButtonState(messageId, {
                copied: true,
              });

              setTimeout(() => {
                dispatch.updateButtonState(messageId, { copied: false });
                copyButtonRef?.current?.blur();
              }, 1000);
            },
          };

          const listenAction = {
            isClicked: isSpeaking,
            ref: speakingButtonRef,
            id: `listen-${messageId}`,
            tooltipContent: isSpeaking
              ? t('feedback.tooltips.listening')
              : t('feedback.tooltips.listen'),
            onClick: () => {
              const isCurrentlySpeaking =
                state[messageId]?.buttonState?.isSpeaking;

              if (isCurrentlySpeaking) {
                // Stop if it's already speaking this message
                cancelSpeaking(messageId);
              } else {
                cancelSpeaking();
                speakMessage(messageId, message.content as string);
              }
            },
          };

          return {
            ...message,
            userFeedbackForm,
            userFeedbackComplete,
            actions: {
              positive: createSentimentAction('positive'),
              negative: createSentimentAction('negative'),
              copy: copyAction,
              listen: listenAction,
            },
          };
        })
      : messages;
  }, [
    t,
    conversationId,
    messages,
    state,
    dispatch,
    isStreaming,
    speakMessage,
    feedbackForms,
    cancelSpeaking,
    feedbackEnabled,
    getUserFeedbackComplete,
    scrollToFeedbackForm,
  ]);
};

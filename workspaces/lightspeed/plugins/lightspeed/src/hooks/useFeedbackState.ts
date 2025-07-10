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
import { useReducer } from 'react';

export type Sentiment = 'positive' | 'negative';

type FeedbackButtonState = {
  sentiment: Sentiment;
  copied: boolean;
  isSpeaking: boolean;
  feedbackSubmitted?: boolean;
};

type MessageState = {
  feedbackForm: Record<Sentiment, boolean>;
  completionForm: Record<Sentiment, boolean>;
  buttonState: FeedbackButtonState;
};

type State = Record<string, MessageState>;

type Action =
  | { type: 'SHOW_FEEDBACK_FORM'; messageId: string; sentiment: Sentiment }
  | { type: 'HIDE_FEEDBACK_FORM'; messageId: string; sentiment: Sentiment }
  | { type: 'SHOW_COMPLETION_FORM'; messageId: string; sentiment: Sentiment }
  | { type: 'HIDE_COMPLETION_FORM'; messageId: string; sentiment: Sentiment }
  | { type: 'RESET_BUTTON_STATE'; messageId: string }
  | {
      type: 'UPDATE_BUTTON_STATE';
      messageId: string;
      payload: Partial<FeedbackButtonState>;
    };

function reducer(state: State, action: Action): State {
  const entry = state[action.messageId] ?? {
    feedbackForm: { positive: false, negative: false },
    completionForm: { positive: false, negative: false },
    buttonState: {},
  };

  switch (action.type) {
    case 'SHOW_FEEDBACK_FORM':
      return {
        ...state,
        [action.messageId]: {
          ...entry,
          feedbackForm: { ...entry.feedbackForm, [action.sentiment]: true },
        },
      };
    case 'HIDE_FEEDBACK_FORM':
      return {
        ...state,
        [action.messageId]: {
          ...entry,
          feedbackForm: { ...entry.feedbackForm, [action.sentiment]: false },
        },
      };
    case 'SHOW_COMPLETION_FORM':
      return {
        ...state,
        [action.messageId]: {
          ...entry,
          completionForm: { ...entry.completionForm, [action.sentiment]: true },
        },
      };
    case 'HIDE_COMPLETION_FORM':
      return {
        ...state,
        [action.messageId]: {
          ...entry,
          completionForm: {
            ...entry.completionForm,
            [action.sentiment]: false,
          },
        },
      };
    case 'UPDATE_BUTTON_STATE':
      return {
        ...state,
        [action.messageId]: {
          ...entry,
          buttonState: { ...entry.buttonState, ...action.payload },
        },
      };
    case 'RESET_BUTTON_STATE': {
      const { [action.messageId]: _, ...rest } = state;
      return rest;
    }
    default:
      return state;
  }
}

export function useFeedbackState() {
  const [state, dispatch] = useReducer(reducer, {});

  const showFeedbackForm = (messageId: string, sentiment: Sentiment) =>
    dispatch({ type: 'SHOW_FEEDBACK_FORM', messageId, sentiment });

  const hideFeedbackForm = (messageId: string, sentiment: Sentiment) =>
    dispatch({ type: 'HIDE_FEEDBACK_FORM', messageId, sentiment });

  const showCompletionForm = (messageId: string, sentiment: Sentiment) =>
    dispatch({ type: 'SHOW_COMPLETION_FORM', messageId, sentiment });

  const hideCompletionForm = (messageId: string, sentiment: Sentiment) =>
    dispatch({ type: 'HIDE_COMPLETION_FORM', messageId, sentiment });

  const updateButtonState = (
    messageId: string,
    payload: Partial<FeedbackButtonState>,
  ) => dispatch({ type: 'UPDATE_BUTTON_STATE', messageId, payload });

  const resetButtonState = (messageId: string) =>
    dispatch({ type: 'RESET_BUTTON_STATE', messageId });

  const getFeedbackState = (messageId: string) =>
    state[messageId] ?? {
      feedbackForm: { positive: false, negative: false },
      completionForm: { positive: false, negative: false },
      buttonState: { sentiment: 'positive', copied: false },
    };

  const toggleFeedbackForm = (
    messageId: string,
    sentimentToShow: Sentiment,
  ) => {
    const opposite: Sentiment =
      sentimentToShow === 'positive' ? 'negative' : 'positive';

    hideFeedbackForm(messageId, opposite);
    showFeedbackForm(messageId, sentimentToShow);
  };

  return {
    state,
    getFeedbackState,
    showFeedbackForm,
    hideFeedbackForm,
    toggleFeedbackForm,
    showCompletionForm,
    hideCompletionForm,
    updateButtonState,
    resetButtonState,
  };
}

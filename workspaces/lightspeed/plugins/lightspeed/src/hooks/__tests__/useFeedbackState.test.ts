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
import { act, renderHook } from '@testing-library/react';

import { useFeedbackState } from '../useFeedbackState';

describe('useFeedbackState', () => {
  const messageId = 'msg1';

  it('should initialize empty state', () => {
    const { result } = renderHook(() => useFeedbackState());
    expect(result.current.state).toEqual({});
  });

  it('should show and hide feedback form for sentiment', () => {
    const { result } = renderHook(() => useFeedbackState());

    act(() => {
      result.current.showFeedbackForm(messageId, 'positive');
    });

    expect(result.current.state[messageId].feedbackForm.positive).toBe(true);

    act(() => {
      result.current.hideFeedbackForm(messageId, 'positive');
    });

    expect(result.current.state[messageId].feedbackForm.positive).toBe(false);
  });

  it('should toggle feedback form (mutually exclusive)', () => {
    const { result } = renderHook(() => useFeedbackState());

    act(() => {
      result.current.toggleFeedbackForm(messageId, 'negative');
    });

    expect(result.current.state[messageId].feedbackForm.negative).toBe(true);
    expect(result.current.state[messageId].feedbackForm.positive).toBe(false);

    act(() => {
      result.current.toggleFeedbackForm(messageId, 'positive');
    });

    expect(result.current.state[messageId].feedbackForm.positive).toBe(true);
    expect(result.current.state[messageId].feedbackForm.negative).toBe(false);
  });

  it('should update button state', () => {
    const { result } = renderHook(() => useFeedbackState());

    act(() => {
      result.current.updateButtonState(messageId, {
        sentiment: 'positive',
        copied: true,
      });
    });

    expect(result.current.state[messageId].buttonState).toEqual({
      sentiment: 'positive',
      copied: true,
    });

    act(() => {
      result.current.updateButtonState(messageId, {
        sentiment: 'positive',
        copied: false,
      });
    });

    expect(result.current.state[messageId].buttonState.copied).toBe(false);
  });

  it('should show and hide completion form', () => {
    const { result } = renderHook(() => useFeedbackState());

    act(() => {
      result.current.showCompletionForm(messageId, 'negative');
    });

    expect(result.current.state[messageId].completionForm.negative).toBe(true);

    act(() => {
      result.current.hideCompletionForm(messageId, 'negative');
    });

    expect(result.current.state[messageId].completionForm.negative).toBe(false);
  });

  it('should reset message state', () => {
    const { result } = renderHook(() => useFeedbackState());

    act(() => {
      result.current.showFeedbackForm(messageId, 'positive');
      result.current.updateButtonState(messageId, {
        copied: true,
        sentiment: 'positive',
      });
      result.current.showCompletionForm(messageId, 'positive');
    });

    expect(result.current.state[messageId]).toBeDefined();

    act(() => {
      result.current.resetButtonState(messageId);
    });

    expect(result.current.state[messageId]).toBeUndefined();
  });

  it('should return default state from getFeedbackState if messageId not found', () => {
    const { result } = renderHook(() => useFeedbackState());

    const state = result.current.getFeedbackState('unknown');
    expect(state.feedbackForm).toEqual({ positive: false, negative: false });
    expect(state.completionForm).toEqual({ positive: false, negative: false });
    expect(state.buttonState).toEqual({ sentiment: 'positive', copied: false });
  });
});

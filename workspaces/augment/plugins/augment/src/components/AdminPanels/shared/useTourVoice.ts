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

const GLOBAL_STORAGE_KEY = 'augment:tour-voice';
const PER_TOUR_PREFIX = 'augment:tour-voice:';
const synth =
  typeof window !== 'undefined' ? window.speechSynthesis : undefined;

function loadGlobalVoicePref(): boolean {
  try {
    return localStorage.getItem(GLOBAL_STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

function saveGlobalVoicePref(enabled: boolean): void {
  try {
    localStorage.setItem(GLOBAL_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    /* noop */
  }
}

export function loadTourVoicePref(tourId: string): boolean | null {
  try {
    const val = localStorage.getItem(`${PER_TOUR_PREFIX}${tourId}`);
    if (val === '1') return true;
    if (val === '0') return false;
    return null;
  } catch {
    return null;
  }
}

export function saveTourVoicePref(tourId: string, enabled: boolean): void {
  try {
    localStorage.setItem(`${PER_TOUR_PREFIX}${tourId}`, enabled ? '1' : '0');
  } catch {
    /* noop */
  }
}

function resolveVoiceEnabled(
  globalEnabled: boolean,
  activeTourId: string | null,
): boolean {
  if (!activeTourId) return globalEnabled;
  const perTour = loadTourVoicePref(activeTourId);
  return perTour ?? globalEnabled;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  if (!synth) return undefined;
  const voices = synth.getVoices();
  return (
    voices.find(v => v.lang === 'en-US' && v.localService) ??
    voices.find(v => v.lang.startsWith('en-') && v.localService) ??
    voices.find(v => v.lang.startsWith('en-')) ??
    voices[0]
  );
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent ?? tmp.innerText ?? '';
}

export interface TourVoice {
  isVoiceEnabled: boolean;
  isSupported: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  setActiveTourId: (id: string | null) => void;
  isVoiceEnabledForTour: (tourId: string) => boolean;
  setVoiceEnabledForTour: (tourId: string, enabled: boolean) => void;
  speak: (title: string, description: string) => Promise<void>;
  stop: () => void;
}

export function useTourVoice(): TourVoice {
  const [globalEnabled, setGlobalEnabled] = useState(loadGlobalVoicePref);
  const [activeTourId, setActiveTourIdState] = useState<string | null>(null);
  const [, setVersion] = useState(0);
  const voiceRef = useRef<SpeechSynthesisVoice | undefined>(undefined);
  const globalEnabledRef = useRef(globalEnabled);
  globalEnabledRef.current = globalEnabled;
  const activeTourIdRef = useRef(activeTourId);
  activeTourIdRef.current = activeTourId;

  const isVoiceEnabled = resolveVoiceEnabled(globalEnabled, activeTourId);
  const enabledRef = useRef(isVoiceEnabled);
  enabledRef.current = isVoiceEnabled;

  useEffect(() => {
    if (!synth) return undefined;
    const load = () => {
      voiceRef.current = pickVoice();
    };
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, []);

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    const tourId = activeTourIdRef.current;
    if (tourId) {
      saveTourVoicePref(tourId, enabled);
    } else {
      setGlobalEnabled(enabled);
      saveGlobalVoicePref(enabled);
    }
    setVersion(v => v + 1);
    if (!enabled) synth?.cancel();
  }, []);

  const setActiveTourId = useCallback((id: string | null) => {
    setActiveTourIdState(id);
    activeTourIdRef.current = id;
  }, []);

  const isVoiceEnabledForTour = useCallback(
    (tourId: string): boolean => {
      const perTour = loadTourVoicePref(tourId);
      return perTour ?? globalEnabled;
    },
    [globalEnabled],
  );

  const setVoiceEnabledForTour = useCallback(
    (tourId: string, enabled: boolean) => {
      saveTourVoicePref(tourId, enabled);
      setVersion(v => v + 1);
    },
    [],
  );

  const stop = useCallback(() => {
    synth?.cancel();
  }, []);

  const speak = useCallback(
    (title: string, description: string): Promise<void> => {
      const resolved = resolveVoiceEnabled(
        globalEnabledRef.current,
        activeTourIdRef.current,
      );
      if (!synth || !resolved) return Promise.resolve();

      synth.cancel();
      const text = `${stripHtml(title)}. ${stripHtml(description)}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      if (voiceRef.current) utterance.voice = voiceRef.current;

      return new Promise<void>(resolve => {
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        synth.speak(utterance);
      });
    },
    [],
  );

  return {
    isVoiceEnabled,
    isSupported: !!synth,
    setVoiceEnabled,
    setActiveTourId,
    isVoiceEnabledForTour,
    setVoiceEnabledForTour,
    speak,
    stop,
  };
}

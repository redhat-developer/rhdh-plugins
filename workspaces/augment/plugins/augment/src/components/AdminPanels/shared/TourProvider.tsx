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

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTheme } from '@mui/material/styles';
import { driver, type DriveStep, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tourStyles.css';
import type { TourId, EnhancedDriveStep, TourAction } from './tourDefinitions';
import { useTourController, type TourControllerAPI } from './TourController';
import type { TourDefinition, TourStepConfig } from './defaultTours';
import { DEFAULT_TOURS } from './defaultTours';
import { useTourVoice, type TourVoice } from './useTourVoice';

const STORAGE_PREFIX = 'augment:tour-completed-';

function isTourCompleted(id: TourId): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${id}`) === '1';
  } catch {
    return false;
  }
}

function markTourCompleted(id: TourId): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, '1');
  } catch {
    /* noop */
  }
}

interface TourContextValue {
  startTour: (id: TourId, autoAdvance?: boolean) => void;
  isCompleted: (id: TourId) => boolean;
  activeTour: TourId | null;
  /** Auto-play tours. Pass specific IDs to only play a subset. */
  startAutoPlay: (tourIds?: TourId[]) => void;
  stopAutoPlay: () => void;
  isAutoPlaying: boolean;
  voice: TourVoice;
}

const noopVoice: TourVoice = {
  isVoiceEnabled: false,
  isSupported: false,
  setVoiceEnabled: () => {},
  setActiveTourId: () => {},
  isVoiceEnabledForTour: () => false,
  setVoiceEnabledForTour: () => {},
  speak: () => Promise.resolve(),
  stop: () => {},
};

const TourContext = createContext<TourContextValue>({
  startTour: () => {},
  isCompleted: () => false,
  activeTour: null,
  startAutoPlay: () => {},
  stopAutoPlay: () => {},
  isAutoPlaying: false,
  voice: noopVoice,
});

export function useTour() {
  return useContext(TourContext);
}

async function executeTourAction(
  action: TourAction,
  ctrl: TourControllerAPI,
): Promise<void> {
  switch (action.type) {
    case 'navigate':
      ctrl.navigatePanel(action.panel);
      break;
    case 'openAgentIntent':
      ctrl.openAgentIntent();
      break;
    case 'selectAgentIntent':
      ctrl.selectAgentIntent(action.cardId);
      break;
    case 'openToolIntent':
      ctrl.openToolIntent();
      break;
    case 'selectToolDeploy':
      ctrl.selectToolDeploy();
      break;
    case 'closeDialogs':
      ctrl.closeAllDialogs();
      break;
    case 'setWizardStep':
      ctrl.setWizardStep(action.step);
      break;
    case 'setDeployMethod':
      ctrl.setDeployMethod(action.method);
      break;
    case 'clickSelector': {
      const el = document.querySelector(action.selector);
      if (el instanceof HTMLElement) el.click();
      break;
    }
    case 'switchToMarketplace':
      ctrl.switchToMarketplace();
      break;
    case 'switchToCommandCenter':
      ctrl.switchToCommandCenter();
      break;
    default:
      break;
  }
}

type AutoAdvanceHook = (d: Driver, speechDone: Promise<void>) => void;
type SpeakFn = (title: string, desc: string) => Promise<void>;

interface VoiceToggle {
  isEnabled: () => boolean;
  toggle: () => void;
}

function injectVoiceButton(toggle: VoiceToggle): void {
  requestAnimationFrame(() => {
    const popover = document.querySelector('.driver-popover');
    if (!popover || popover.querySelector('.tour-voice-btn')) return;

    const footer = popover.querySelector('.driver-popover-footer');
    if (!footer) return;

    const btn = document.createElement('button');
    btn.className = 'tour-voice-btn';
    btn.type = 'button';
    btn.title = toggle.isEnabled() ? 'Mute voice' : 'Unmute voice';
    btn.innerHTML = toggle.isEnabled()
      ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';

    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggle.toggle();
      btn.title = toggle.isEnabled() ? 'Mute voice' : 'Unmute voice';
      btn.innerHTML = toggle.isEnabled()
        ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>'
        : '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
    });

    const progress = footer.querySelector('.driver-popover-progress-text');
    if (progress) {
      progress.parentElement?.insertBefore(btn, progress.nextSibling);
    } else {
      footer.prepend(btn);
    }
  });
}

function configToEnhancedSteps(steps: TourStepConfig[]): EnhancedDriveStep[] {
  return steps.map(s => {
    const enhanced: EnhancedDriveStep = {
      element: s.target || undefined,
      popover: {
        title: s.title,
        description: s.description,
        side: s.side as 'top' | 'bottom' | 'left' | 'right' | undefined,
      },
    };
    if (s.action) {
      enhanced.tourAction = s.action as TourAction;
    }
    if (s.waitFor) {
      enhanced.tourSelector = s.waitFor;
    } else if (s.target && s.action) {
      enhanced.tourSelector = s.target;
    }
    return enhanced;
  });
}

function buildDriverSteps(
  steps: EnhancedDriveStep[],
  ctrl: TourControllerAPI,
  speakFn?: SpeakFn,
  voiceToggle?: VoiceToggle,
  onStepShown?: AutoAdvanceHook,
): DriveStep[] {
  return steps.map((step): DriveStep => {
    const hasAction = !!step.tourAction;
    const selector = step.tourSelector;
    const needsCustomHook = hasAction || selector || !!onStepShown || !!speakFn;

    if (!needsCustomHook) {
      return step as DriveStep;
    }

    const result: DriveStep = {
      ...step,
      popover: step.popover ? { ...step.popover } : undefined,
    };

    if (selector) {
      result.element = () =>
        document.querySelector(selector) as unknown as Element;
    }

    result.onHighlightStarted = (_el, _step, opts) => {
      const { driver: d } = opts;
      const run = async () => {
        if (step.tourAction) {
          await executeTourAction(step.tourAction, ctrl);
        }
        if (selector) {
          await ctrl.waitForSelector(selector, 3000);
        }
        if (hasAction || selector) {
          d.refresh();
        }
        if (voiceToggle) injectVoiceButton(voiceToggle);
        const speechDone = speakFn
          ? speakFn(
              step.popover?.title?.toString() ?? '',
              step.popover?.description?.toString() ?? '',
            )
          : Promise.resolve();
        onStepShown?.(d, speechDone);
      };
      run();
    };

    delete (result as Record<string, unknown>).tourAction;
    delete (result as Record<string, unknown>).tourSelector;

    return result;
  });
}

const AUTO_ADVANCE_DELAY = 4000;
const INTER_TOUR_DELAY = 2000;

export function TourProvider({
  children,
  tours,
}: {
  children: React.ReactNode;
  tours?: TourDefinition[];
}) {
  const tourData = tours && tours.length > 0 ? tours : DEFAULT_TOURS;
  const tourStepsMap = useMemo(() => {
    const map: Record<string, TourStepConfig[]> = {};
    for (const t of tourData) {
      map[t.id] = t.steps;
    }
    return map;
  }, [tourData]);
  const tourOrder = useMemo(() => tourData.map(t => t.id), [tourData]);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTour, setActiveTour] = useState<TourId | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [, setVersion] = useState(0);
  const driverRef = useRef<Driver | null>(null);
  const autoPlayQueueRef = useRef<TourId[]>([]);
  const autoPlayFullListRef = useRef<TourId[]>([]);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const startTourRef = useRef<(id: TourId, autoAdvance?: boolean) => void>(
    () => {},
  );
  const ctrl = useTourController();
  const voice = useTourVoice();

  const clearAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceTimerRef.current !== null) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  const stopAutoPlay = useCallback(() => {
    autoPlayQueueRef.current = [];
    clearAutoAdvanceTimer();
    setIsAutoPlaying(false);
  }, [clearAutoAdvanceTimer]);

  const startTour = useCallback(
    (id: TourId, autoAdvance?: boolean) => {
      const rawSteps = tourStepsMap[id];
      if (!rawSteps?.length) return;

      if (driverRef.current) {
        driverRef.current.destroy();
      }

      const autoAdvanceHook: AutoAdvanceHook | undefined = autoAdvance
        ? (dInstance: Driver, speechDone: Promise<void>) => {
            clearAutoAdvanceTimer();
            const timerDelay = new Promise<void>(r =>
              setTimeout(r, AUTO_ADVANCE_DELAY),
            );
            Promise.all([timerDelay, speechDone]).then(() => {
              if (dInstance.hasNextStep()) {
                dInstance.moveNext();
              } else {
                clearAutoAdvanceTimer();
                driverRef.current = null;
                voice.stop();
                voice.setActiveTourId(null);
                dInstance.destroy();
                ctrl.closeAllDialogs();
                markTourCompleted(id);
                setActiveTour(null);
                setVersion(v => v + 1);

                const queue = autoPlayQueueRef.current;
                if (queue.length > 0) {
                  const nextId = queue.shift()!;
                  setTimeout(
                    () => startTourRef.current(nextId, true),
                    INTER_TOUR_DELAY,
                  );
                } else {
                  setIsAutoPlaying(false);
                  ctrl.returnToGuidedExperience();
                }
              }
            });
          }
        : undefined;

      voice.setActiveTourId(id);

      const speakFn: SpeakFn = (title, desc) => voice.speak(title, desc);
      const voiceToggle: VoiceToggle = {
        isEnabled: () => voice.isVoiceEnabledForTour(id),
        toggle: () => {
          const next = !voice.isVoiceEnabledForTour(id);
          voice.setVoiceEnabled(next);
        },
      };
      const enhancedSteps = configToEnhancedSteps(rawSteps);
      const builtSteps = buildDriverSteps(
        enhancedSteps,
        ctrl,
        speakFn,
        voiceToggle,
        autoAdvanceHook,
      );

      const steps: DriveStep[] = [];
      if (autoAdvance) {
        const meta = tourData.find(t => t.id === id);
        const playList = autoPlayFullListRef.current;
        const tourIndex = playList.indexOf(id) + 1;
        const tourTotal = playList.length;
        const titleCard: DriveStep = {
          popover: {
            title: `▶ Tour ${tourIndex || 1} of ${tourTotal || 1}: ${meta?.title ?? id}`,
            description: meta?.description ?? '',
          },
        };
        if (autoAdvanceHook) {
          titleCard.onHighlightStarted = (_el, _step, opts) => {
            injectVoiceButton(voiceToggle);
            const speechDone = speakFn(
              meta?.title ?? id,
              meta?.description ?? '',
            );
            autoAdvanceHook(opts.driver, speechDone);
          };
        }
        steps.push(titleCard);
      }
      steps.push(...builtSteps);

      let destroying = false;
      const d = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
        stagePadding: 8,
        stageRadius: 8,
        popoverClass: `augment-tour-popover${isDark ? ' augment-tour-dark' : ''}`,
        progressText: '{{current}} of {{total}}',
        nextBtnText: autoAdvance ? 'Next ⏵' : 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Done',
        steps,
        onDestroyStarted: () => {
          if (destroying) return;
          destroying = true;
          const finished = !d.hasNextStep();
          clearAutoAdvanceTimer();
          voice.stop();
          voice.setActiveTourId(null);
          driverRef.current = null;
          d.destroy();
          ctrl.closeAllDialogs();

          if (finished) {
            markTourCompleted(id);
          }

          setActiveTour(null);
          setVersion(v => v + 1);

          if (!finished) {
            autoPlayQueueRef.current = [];
            setIsAutoPlaying(false);
          }
          ctrl.returnToGuidedExperience();
        },
      });

      setActiveTour(id);
      d.drive();
      driverRef.current = d;
    },
    [isDark, ctrl, clearAutoAdvanceTimer, voice, tourData, tourStepsMap],
  );

  startTourRef.current = startTour;

  const startAutoPlay = useCallback(
    (tourIds?: TourId[]) => {
      const fullList = tourIds ?? [...tourOrder];
      const queue = [...fullList];
      const first = queue.shift();
      if (!first) return;
      autoPlayFullListRef.current = fullList;
      autoPlayQueueRef.current = queue;
      setIsAutoPlaying(true);
      startTourRef.current(first, true);
    },
    [tourOrder],
  );

  const isCompleted = useCallback((id: TourId) => isTourCompleted(id), []);

  const value = useMemo(
    () => ({
      startTour,
      isCompleted,
      activeTour,
      startAutoPlay,
      stopAutoPlay,
      isAutoPlaying,
      voice,
    }),
    [
      startTour,
      isCompleted,
      activeTour,
      startAutoPlay,
      stopAutoPlay,
      isAutoPlaying,
      voice,
    ],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

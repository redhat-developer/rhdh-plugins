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
import { useState, useEffect } from 'react';

import { useTranslation } from './useTranslation';
import { useLanguage } from './useLanguage';

const getGreetingByTimeZone = (
  timeZone: string | undefined,
  t: any,
  language: string,
) => {
  // Use user's language for consistent time parsing
  const hours = new Date().toLocaleString(language, {
    timeZone,
    hour: 'numeric',
    hour12: false,
  });
  const hour = parseInt(hours, 10);

  // Note: Time boundaries could be culturally specific in the future
  // For now, using universal 12/18 hour boundaries
  if (hour < 12) {
    return t('onboarding.greeting.goodMorning');
  }
  if (hour < 18) {
    return t('onboarding.greeting.goodAfternoon');
  }
  return t('onboarding.greeting.goodEvening');
};

const useGreeting = (timeZone?: string) => {
  const { t } = useTranslation();
  const language = useLanguage();
  const [greeting, setGreeting] = useState<string>(
    getGreetingByTimeZone(timeZone, t, language),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreetingByTimeZone(timeZone, t, language));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timeZone, t, language]);

  return greeting;
};

export default useGreeting;

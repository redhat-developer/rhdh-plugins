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
import React from 'react';
import { useTranslation } from './useTranslation';

const getGreetingByTimeZone = (timeZone?: string, t?: any) => {
  const hours = new Date().toLocaleString('en-US', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  });
  const hour = parseInt(hours, 10);

  if (hour < 12) {
    return t ? t('greeting.goodMorning') : 'Good morning';
  }
  if (hour < 18) {
    return t ? t('greeting.goodAfternoon') : 'Good afternoon';
  }
  return t ? t('greeting.goodEvening') : 'Good evening';
};

const useGreeting = (timeZone?: string) => {
  const { t } = useTranslation();
  const [greeting, setGreeting] = React.useState<string>(
    getGreetingByTimeZone(timeZone, t),
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreetingByTimeZone(timeZone, t));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timeZone, t]);

  return greeting;
};

export default useGreeting;

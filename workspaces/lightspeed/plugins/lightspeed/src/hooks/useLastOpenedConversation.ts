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
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';

type UseLastOpenedConversationReturn = {
  lastOpenedId: string | null;
  setLastOpenedId: Dispatch<SetStateAction<string | null>>;
  clearLastOpenedId: () => void;
  isReady: boolean;
};

export const useLastOpenedConversation = (
  user: string | undefined,
  key = 'lastOpenedConversation',
): UseLastOpenedConversationReturn => {
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setLastOpenedId(null);
      setIsReady(false);
      return;
    }

    try {
      const storedData = localStorage.getItem(key);
      const parsedData = storedData ? JSON.parse(storedData) : {};
      setLastOpenedId(parsedData[user] || null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error accessing localStorage:', error);
    } finally {
      setIsReady(true);
    }
  }, [user, key]);

  useEffect(() => {
    if (!user || lastOpenedId === null) return;
    // Update localStorage whenever the last opened ID changes
    try {
      const storedData = localStorage.getItem(key);
      const parsedData = storedData ? JSON.parse(storedData) : {};

      if (parsedData[user] !== lastOpenedId) {
        parsedData[user] = lastOpenedId;
        localStorage.setItem(key, JSON.stringify(parsedData));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating localStorage:', error);
    }
  }, [lastOpenedId, user, key]);

  const clearLastOpenedId = useCallback(() => {
    if (!user) return;

    try {
      const storedData = localStorage.getItem(key);
      const parsedData = storedData ? JSON.parse(storedData) : {};
      delete parsedData[user];
      localStorage.setItem(key, JSON.stringify(parsedData));
      setLastOpenedId(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error clearing localStorage:', error);
    }
  }, [user, key]);

  return { lastOpenedId, setLastOpenedId, clearLastOpenedId, isReady };
};

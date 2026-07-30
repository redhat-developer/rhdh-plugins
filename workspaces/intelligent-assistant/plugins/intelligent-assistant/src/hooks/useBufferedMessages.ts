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

export const useBufferedMessages = <T>(messages: T[], interval = 30): T[] => {
  const [bufferedMessages, setBufferedMessages] = React.useState(messages);
  const lastUpdateTime = React.useRef(0);
  const animationFrame = React.useRef<number | null>(null);

  React.useEffect(() => {
    const now = Date.now();

    const update = () => {
      setBufferedMessages(messages);
      lastUpdateTime.current = now;
    };

    if (now - lastUpdateTime.current > interval) {
      update();
    } else {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(update);
    }

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [messages, interval]);

  return bufferedMessages;
};

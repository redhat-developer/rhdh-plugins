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

import React, { useState, useMemo, useEffect, useRef } from 'react';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { sanitizeBrandingUrl } from '../../theme/branding';

interface BotAvatarIconProps {
  botAvatarUrl?: string;
  fontSize?: number;
}

/**
 * Renders a custom bot avatar image when configured via branding,
 * falling back to the default AutoAwesomeOutlined (sparkle) icon.
 */
export const BotAvatarIcon: React.FC<BotAvatarIconProps> = React.memo(
  function BotAvatarIcon({ botAvatarUrl, fontSize = 18 }) {
    const [imgError, setImgError] = useState(false);
    const prevUrlRef = useRef(botAvatarUrl);
    const safeUrl = useMemo(
      () => sanitizeBrandingUrl(botAvatarUrl),
      [botAvatarUrl],
    );

    useEffect(() => {
      if (prevUrlRef.current !== botAvatarUrl) {
        prevUrlRef.current = botAvatarUrl;
        setImgError(false);
      }
    }, [botAvatarUrl]);

    if (safeUrl && !imgError) {
      return (
        <img
          src={safeUrl}
          alt=""
          onError={() => setImgError(true)}
          style={{
            width: fontSize,
            height: fontSize,
            objectFit: 'contain',
            borderRadius: '50%',
          }}
        />
      );
    }

    return <AutoAwesomeOutlinedIcon sx={{ fontSize }} />;
  },
);

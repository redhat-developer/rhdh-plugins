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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Link from '@mui/material/Link';
import { AccessCodeInputModal } from '../Modals/AccessCodeInputModal';
import { FooterCopyright } from '@rhds/elements/react/rh-footer/rh-footer-copyright';
import { FooterUniversal } from '@rhds/elements/react/rh-footer/rh-footer-universal';

import '@rhds/elements/rh-footer/rh-footer-lightdom.css';
import { useEffect, useRef } from 'react';

// Create the TrustArc element once, outside of any component
let trustArcElement: HTMLSpanElement | null = null;

const createTrustArcElement = () => {
  if (!trustArcElement) {
    trustArcElement = document.createElement('span');
    trustArcElement.id = 'teconsent';
    trustArcElement.style.display = 'none';
  }
  return trustArcElement;
};

const CookieConsentElement = () => {
  const consentRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const spanElement = createTrustArcElement();

    if (consentRef.current && !consentRef.current.contains(spanElement)) {
      consentRef.current.appendChild(spanElement);
    }
  });

  return <li ref={consentRef} />;
};

export const SandboxCatalogFooter = () => {
  const theme = useTheme();
  const [accessCodeModalOpen, setAccessCodeModalOpen] = React.useState(false);

  const handleClick = () => {
    setAccessCodeModalOpen(true);
  };

  return (
    <>
      <Box
        component="footer"
        sx={{
          padding: theme.spacing(2),
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography variant="body1" color="textPrimary" align="center">
          Have an activation code?{' '}
          <Link
            component="button"
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            Click here
          </Link>
        </Typography>
      </Box>
      <AccessCodeInputModal
        modalOpen={accessCodeModalOpen}
        setOpen={setAccessCodeModalOpen}
      />
      <FooterUniversal slot="universal" data-testid="rh-footer-universal">
        <h3 slot="links-primary" className="pf-v6-u-w-100 pf-v6-u-pb-md">
          About
        </h3>
        <ul slot="links-primary">
          <li>
            <a href="https://redhat.com/en/about/company">About Red Hat</a>
          </li>
          <li>
            <a href="https://redhat.com/en/jobs">Jobs</a>
          </li>
          <li>
            <a href="https://redhat.com/en/events">Events</a>
          </li>
          <li>
            <a href="https://redhat.com/en/about/office-locations">Locations</a>
          </li>
          <li>
            <a href="https://redhat.com/en/contact">Contact Red Hat</a>
          </li>
          <li>
            <a href="https://redhat.com/en/blog">Red Hat Blog</a>
          </li>
          <li>
            <a href="https://redhat.com/en/about/our-culture/inclusion">
              Inclusion at Red Hat
            </a>
          </li>
          <li>
            <a href="https://coolstuff.redhat.com/">Cool Stuff Store</a>
          </li>
          <li>
            <a href="https://www.redhat.com/en/summit">Red Hat Summit</a>
          </li>
        </ul>
        <h3 slot="links-secondary" className="pf-v6-u-w-100 pf-v6-u-pb-md">
          Privacy and legal
        </h3>
        <ul slot="links-secondary">
          <li>
            <a href="https://redhat.com/en/about/privacy-policy">
              Privacy statement
            </a>
          </li>
          <li>
            <a href="https://redhat.com/en/about/terms-use">Terms of use</a>
          </li>
          <li>
            <a href="https://redhat.com/en/about/all-policies-guidelines">
              All policies and guidelines
            </a>
          </li>
          <li>
            <a href="https://redhat.com/en/about/digital-accessibility">
              Digital accessibility
            </a>
          </li>
          <CookieConsentElement />
          <div id="consent_blackbar" />
        </ul>
        <FooterCopyright
          slot="links-secondary"
          className="pf-v6-u-pt-md"
          data-testid="rh-footer-copyright"
        >
          © 2025 Red Hat, Inc.
        </FooterCopyright>
      </FooterUniversal>
    </>
  );
};

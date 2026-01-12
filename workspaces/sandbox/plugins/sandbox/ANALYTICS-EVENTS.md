# Developer Sandbox - Analytics Events

This document lists all analytics events sent to **Segment**, **Adobe Analytics (EDDL)**, and **Marketo**.

## Track Events

All events are sent to Segment and Adobe Analytics with the following patterns. Additionally, **Catalog clicks only** are sent to Marketo:

- **Segment**: Event name = `{text} {verb}` where verb is `launched` (CTA) or `clicked` (non-CTA)
- **Adobe CTA**: Pushed to `window.appEventData` as `Master Link Clicked`
- **Adobe non-CTA**: Automatically tracked via data attributes
- **Marketo**: Catalog clicks only sent to Workato webhook for Marketo integration

| Event Text                                                                             | Section      | Link Type | Segment Event Name                                                                           | Adobe Tracking  | Description                                                                  | Intcmp ID          |
| -------------------------------------------------------------------------------------- | ------------ | --------- | -------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------- | ------------------ |
| **OpenShift**                                                                          | Catalog      | cta       | `OpenShift launched`                                                                         | Manual push     | User clicks to launch OpenShift console for their sandbox environment        | 701Pe00000dnCEYIA2 |
| **OpenShift AI**                                                                       | Catalog      | cta       | `OpenShift AI launched`                                                                      | Manual push     | User clicks to launch OpenShift AI dashboard for ML/AI workloads             | 701Pe00000do2uiIAA |
| **Dev Spaces**                                                                         | Catalog      | cta       | `Dev Spaces launched`                                                                        | Manual push     | User clicks to launch OpenShift Dev Spaces cloud development environment     | 701Pe00000doTQCIA2 |
| **Ansible Automation Platform**                                                        | Catalog      | cta       | `Ansible Automation Platform launched`                                                       | Manual push     | User clicks to provision or access Ansible Automation Platform instance      | 701Pe00000dowQXIAY |
| **OpenShift Virtualization**                                                           | Catalog      | cta       | `OpenShift Virtualization launched`                                                          | Manual push     | User clicks to launch OpenShift Virtualization console for VM management     | 701Pe00000dov6IIAQ |
| **Get Started - Ansible**                                                              | Catalog      | cta       | `Get Started - Ansible launched`                                                             | Manual push     | User clicks to access their provisioned Ansible instance from the modal      | 701Pe00000dowQXIAY |
| **Get started with your Developer Sandbox**                                            | Activities   | default   | `Get started with your Developer Sandbox clicked`                                            | Data attributes | User clicks to view the getting started tutorial for Developer Sandbox       | -                  |
| **Streamline automation in OpenShift Dev Spaces with Ansible**                         | Activities   | default   | `Streamline automation in OpenShift Dev Spaces with Ansible clicked`                         | Data attributes | User clicks to view learning resource about Ansible automation in Dev Spaces | -                  |
| **How to deploy a Java application on Kubernetes in minutes**                          | Activities   | default   | `How to deploy a Java application on Kubernetes in minutes clicked`                          | Data attributes | User clicks to view Java application deployment tutorial                     | -                  |
| **Foundations of OpenShift**                                                           | Activities   | default   | `Foundations of OpenShift clicked`                                                           | Data attributes | User clicks to view foundational OpenShift learning resource                 | -                  |
| **Using OpenShift Pipelines**                                                          | Activities   | default   | `Using OpenShift Pipelines clicked`                                                          | Data attributes | User clicks to view CI/CD pipelines tutorial for OpenShift                   | -                  |
| **OpenShift virtualization and application modernization using the Developer Sandbox** | Activities   | default   | `OpenShift virtualization and application modernization using the Developer Sandbox clicked` | Data attributes | User clicks to view learning resource about VM management and modernization  | -                  |
| **Contact Red Hat Sales**                                                              | Support      | cta       | `Contact Red Hat Sales launched`                                                             | Manual push     | User clicks to contact Red Hat sales team for support or purchasing          | -                  |
| **Send Code**                                                                          | Verification | cta       | `Send Code launched`                                                                         | Manual push     | User submits their phone number to receive a verification code via SMS       | -                  |
| **Cancel Verification**                                                                | Verification | cta       | `Cancel Verification launched`                                                               | Manual push     | User cancels the phone verification process and closes the modal             | -                  |
| **Start Trial**                                                                        | Verification | cta       | `Start Trial launched`                                                                       | Manual push     | User submits the verification code to complete signup and start their trial  | -                  |
| **Resend Code**                                                                        | Verification | cta       | `Resend Code launched`                                                                       | Manual push     | User requests a new verification code to be sent to their phone              | -                  |

### Event Properties

All events include these properties:

| Property           | Value Pattern                  | Example                       |
| ------------------ | ------------------------------ | ----------------------------- |
| `category`         | `Developer Sandbox\|{Section}` | `Developer Sandbox\|Catalog`  |
| `regions`          | `sandbox-{section-lowercase}`  | `sandbox-catalog`             |
| `text`             | Event text from table above    | `OpenShift`                   |
| `href`             | Destination URL                | `https://console.example.com` |
| `linkType`         | `cta` or `default`             | `cta`                         |
| `internalCampaign` | Campaign ID (if applicable)    | `701Pe00000dnCEYIA2`          |

## Identify & Group Calls

| Call Type    | Platform | Trigger                                     | ID Used     | Traits/Properties                                                               |
| ------------ | -------- | ------------------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| **Identify** | Segment  | First time `userID` available in session    | `userID`    | `{ company: [user company], email_domain: [user email domain] }` (when present) |
| **Group**    | Segment  | First time `accountID` available in session | `accountID` | `{ ebs: [account number] }` (when present)                                      |

## Marketo Integration (Catalog Clicks Only)

Catalog clicks are sent to Marketo via a Workato webhook. The webhook URL is fetched dynamically from the `/uiconfig` API endpoint (`workatoWebHookURL` field).

### Marketo Payload

| Field                 | Source                      | Example                          | Description                                         |
| --------------------- | --------------------------- | -------------------------------- | --------------------------------------------------- |
| `C_FirstName`         | `userData.givenName`        | `John`                           | User's first name                                   |
| `C_LastName`          | `userData.familyName`       | `Doe`                            | User's last name                                    |
| `C_EmailAddress`      | `userData.email`            | `jdtest@test.com`                | User's email address (required for tracking)        |
| `C_Company`           | `userData.company`          | `Red Hat`                        | User's company (empty if not available)             |
| `A_Timestamp`         | Current UTC timestamp       | `2025/10/20 14:57:46`            | Timestamp of the click in UTC (YYYY/MM/DD HH:mm:ss) |
| `F_FormData_Source`   | Fixed value                 | `sandbox-redhat-com-integration` | Fixed identifier for this integration               |
| `A_OfferID`           | `internalCampaign` (Intcmp) | `701Pe00000dnCEYIA2`             | Product offer ID from intcmp parameter              |
| `A_TacticID_External` | Cookie: `rh_omni_tc`        | `RHCTN1250000786344`             | External tactic ID from Red Hat marketing cookie    |
| `A_TacticID_Internal` | Cookie: `rh_omni_itc`       | `RHCTE1250000786360`             | Internal tactic ID from Red Hat marketing cookie    |
| `Status`              | Fixed value                 | `Engaged`                        | User engagement status                              |

## Notes

- **Segment** tracks all events (both CTA and non-CTA)
- **Adobe** manually tracks CTA events; non-CTA events use automatic tracking via dpal.js
- **Marketo** tracks Catalog clicks only via Workato webhook integration
- All tracking is non-blocking and includes error handling
- Scripts loaded: `trustarc.js` (privacy), `dpal.js` (Adobe tracking)

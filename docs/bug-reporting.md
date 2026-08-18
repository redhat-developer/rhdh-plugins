# Reporting Bugs in RHDH

If you encounter a bug in RHDH, please open a ticket in [RHDHBUGS](https://redhat.atlassian.net/jira/software/c/projects/RHDHBUGS/boards/5367) according to the [RHDHBUGS Specifications](#rhdhbugs-specifications). If the issue is introduced by [Backstage](https://backstage.io/) itself, follow the instructions for [Reporting an Upstream Bug](#reporting-an-upstream-bug).

## RHDHBUGS Specifications

When filing a bug in the [RHDHBUGS](https://redhat.atlassian.net/jira/software/c/projects/RHDHBUGS/boards/5367) project, include the following information:

### Required Fields

| Field               | Description                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Summary**         | A concise, descriptive title (e.g. _"Topology plugin crashes on node click when Kubernetes API returns 503"_). |
| **Description**     | See [What to Include in the Description](#what-to-include-in-the-description).                                 |
| **Component**       | The plugin or area affected (e.g. `Topology`, `TechDocs`, `Scaffolder`).                                       |
| **Affects Version** | The RHDH version(s) where the bug is observed (e.g. `1.5`, `1.6`).                                             |
| **Priority**        | See [Setting the Priority](#setting-the-priority).                                                             |

### What to Include in the Description

A good bug report should contain enough context for someone unfamiliar with the issue to reproduce and investigate it. Include:

1. **Steps to reproduce** — Numbered, precise steps to trigger the bug.
2. **Expected behaviour** — What should happen.
3. **Actual behaviour** — What happens instead, including error messages, stack traces, or screenshots.
4. **Environment details** — RHDH version, deployment method (Helm / Operator), OpenShift version, browser (for frontend issues).
5. **Workaround** — If one exists, describe it. This helps triage and unblocks other users.
6. **Logs / evidence** — Attach relevant logs or screenshots. Redact any sensitive information.

### Setting the Priority

Choose a priority that reflects the real-world impact of the bug:

| Priority     | When to use                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blocker**  | The bug **prevents a plugin from running or loading at all**, or it blocks a release from shipping. Use this when RHDH or a plugin is completely non-functional and there is no workaround. |
| **Critical** | The bug **requires imminent action for a release** — a significant regression, data loss risk, or a broken core workflow that affects most users.                                           |
| **Major**    | A serious issue that impacts important functionality but does not completely prevent the plugin from operating. Needs to be addressed in the current or next release.                       |
| **Normal**   | A noticeable issue that affects a subset of users or use cases but does not block core functionality.                                                                                       |
| **Minor**    | Cosmetic issues, typos, or minor inconveniences with no functional impact.                                                                                                                  |

Please ping @rhdh-cope on Slack in the #rhdh-plugins-ecosystem channel for awareness if you have opened a **Blocker** or **Critical** bug.

> [!IMPORTANT]
> If you are unsure between priorities, err on the higher side and add a comment explaining the impact. It is easier to downgrade a priority than to miss a release-blocking issue.

## Reporting an Upstream Bug

Some bugs originate in [Backstage](https://backstage.io/) itself (the upstream open-source project) rather than in RHDH-specific code. Even when a bug is upstream, **you should still file a ticket in RHDHBUGS** if it affects RHDH users — this ensures the issue is tracked, prioritised, and addressed within the RHDH release process.

### When to File an Upstream Bug in RHDHBUGS

File in RHDHBUGS if the upstream bug:

- Affects the functionality of RHDH or a plugin shipped in RHDH.
- Requires a patch, cherry-pick, or workaround to be applied on the RHDH side.
- Needs to be tracked for a specific RHDH release.

In the RHDHBUGS ticket:

1. **Link the upstream issue** — Include a link to the upstream Backstage GitHub issue (or open one if it doesn't exist yet).
2. **Note that the root cause is upstream** — Add a comment or label (e.g. `upstream`) so that triagers know where the fix needs to land.
3. **Set the priority** based on the impact to RHDH, not the upstream project's assessment.

### Upstream Timeline for Release Inclusion

RHDH ships with a specific pinned version of Backstage. For an upstream fix to be included in an RHDH release, it must be merged upstream **before** that version is released. This is typically just over a month before RHDH Feature Freeze, though the exact dates can be confirmed via the RHDH release schedule. If the fix misses the targeted Backstage release, it will not be available in that RHDH release unless a patch is cherry-picked on the RHDH side (which should be avoided where possible). Keep in mind that fixes in the upstream can be slow to merge, so be sure to report early and coordinate with the RHDH team to have the problem addressed.

> [!NOTE]
> If an upstream fix is critical and the Backstage release window has passed, coordinate with the RHDH team (#rhdh-plugins-ecosystem on Slack) to discuss options such as carrying a temporary patch.

### Summary: Upstream Bug Workflow

```
Bug found in RHDH
  └─ Root cause is upstream?
       ├─ YES → File in RHDHBUGS (track internally)
       │         └─ File / link upstream GitHub issue
       │              └─ Get fix merged before target Backstage release
       │                   └─ Bump Backstage version in RHDH
       └─ NO  → File in RHDHBUGS (fix in RHDH)
```

# Create PR for rhdh-plugins

You are automating the full PR workflow for the `redhat-developer/rhdh-plugins` monorepo. Follow every step below **in order**. Do not skip steps. Where an approval gate is marked, you **must** ask the user before proceeding.

---

## Step 1 — Detect workspace(s) from staged changes

1. Run `git diff --cached --name-only` to list all staged files.
2. If no files are staged, stop and tell the user: "No staged changes found. Please stage your changes with `git add` before running this command."
3. Extract the workspace(s) from the staged file paths. The workspace is the second path segment (e.g., `workspaces/bulk-import/plugins/foo/src/index.ts` → workspace is `workspaces/bulk-import`).
4. If staged files span **multiple** workspaces, inform the user: "Changes detected in **N** workspace(s): `<workspace-1>`, `<workspace-2>`, … Are you sure you want to proceed? (Yes/No)". Wait for confirmation before continuing. If the user declines, stop.
5. Store the list of workspace names (e.g., `["bulk-import", "lightspeed"]`) and workspace paths (e.g., `["workspaces/bulk-import", "workspaces/lightspeed"]`) for use in later steps.

---

## Step 2 — Capture baseline of unstaged/untracked files

Run `git status --porcelain` and save the full output as the **baseline snapshot**. This captures all files that were already dirty or untracked before any build commands run. You will need this in Step 7 to filter out pre-existing changes.

---

## Step 3 — Create a new branch (only if on `main`)

1. Run `git branch --show-current` to determine the current branch.
2. **If the current branch is `main`:**
   a. Analyze the staged diff (`git diff --cached`) to understand the nature of the changes.
   b. Generate a descriptive branch name in the format: `feat/<workspace-name>-<short-description>` (use `fix/` prefix for bug fixes). If multiple workspaces are affected, use a general description instead of a single workspace name.
   c. **Ask the user for approval** before proceeding. Present:
   - The proposed branch name
   - A one-line summary of the changes
     d. Only after approval, run: `git checkout -b <branch-name>`
3. **If the current branch is NOT `main`:** skip branch creation and continue on the current branch. Inform the user: "Already on branch `<branch-name>`, skipping branch creation."

---

## Step 4 — Run build/validation commands in each workspace

For **each** workspace detected in Step 1, run the following commands **sequentially** inside that workspace's directory (e.g., `workspaces/bulk-import`). If any command fails, **stop immediately** and report the error to the user with the failing command, workspace, and its output.

Repeat this block for every workspace:

1. `yarn` — install dependencies
2. `yarn prettier:fix` — format code
3. `yarn tsc:full` — full TypeScript type check
4. `yarn build:all` — build all packages
5. `yarn test --watchAll=false` — run tests (disable Jest watch mode so it exits after running)
6. `yarn build:api-reports:only` — generate/update API reports

---

## Step 5 — Generate changeset for each workspace (fully automated)

For **each** workspace detected in Step 1, generate a separate changeset:

1. From the staged diff (`git diff --cached`), determine:
   - Which **plugins** under **this** workspace are affected. Only look at `plugins/*` directories — **ignore `packages/*` entirely** (those are private app/backend packages that are never published and never need changesets).
   - Within each plugin, **only include it if it has changes inside `src/` or other published paths** (e.g., root-level `index.ts`, `config.d.ts`, `package.json`). Changes that are only in non-published paths like `dev/`, `tests/`, `__fixtures__/`, or storybook stories do **NOT** require a changeset for that plugin — skip it.
   - Read each affected plugin's `package.json` to get its npm package name (e.g., `@red-hat-developer-hub/backstage-plugin-bulk-import`).
   - The semver bump type: use `patch` for bug fixes, `minor` for new features or enhancements, `major` for breaking changes. Infer from the nature of the diff.
   - **If no plugins in the workspace have published-source changes, skip changeset generation for that workspace entirely.**
2. Generate a short, human-readable summary of the change for this workspace (1-2 sentences).
3. Generate a random changeset ID (lowercase letters, 5-8 characters, e.g., `happy-pens-smile`). Use a pattern of `<adjective>-<noun>-<verb>` with random words. Each workspace must get a **unique** ID.
4. Write the changeset file directly to `<workspace>/.changeset/<random-id>.md`:

```
---
'<package-name>': <bump-type>
---

<generated summary>
```

If multiple packages within the same workspace are affected, list each on its own line in the YAML front matter.

**Do NOT run `yarn changeset` interactively.** The files must be created programmatically with zero user prompts.

---

## Step 6 — Identify build-generated files

1. Run `git status --porcelain` to get the **current snapshot** of dirty/untracked files.
2. Compare the current snapshot against the **baseline snapshot** captured in Step 2.
3. Files that appear **only in the current snapshot** (not in the baseline) are build-generated files — these were created or modified by the build commands in Step 4 or the changeset in Step 5.
4. Files that were **already in the baseline** must be excluded — they are pre-existing local changes (e.g., `app-config.yaml` overrides, test fixtures, dev-only files) and should NOT be staged.

---

## Step 7 — Stage build-generated files (APPROVAL REQUIRED)

1. Present the filtered list of build-generated files (from Step 6) to the user.
2. **Ask the user for approval** before staging.
3. Only after approval, run `git add` for each approved file.

---

## Step 8 — Commit (APPROVAL REQUIRED)

1. Run `git diff --cached --stat` to review all staged changes (original + build-generated).
2. Generate a commit message based on the full staged diff. Follow conventional commit format: `<type>(<workspace>): <short description>` (e.g., `feat(bulk-import): add support for batch repository imports`).
3. **Ask the user for approval**. Present:
   - The proposed commit message
   - A summary of staged files
4. Only after approval, commit with the **`-s` flag** (Signed-off-by):

```
git commit -s -m "<approved-message>"
```

---

## Step 9 — Push and create PR

1. Push the branch to origin:

```
git push -u origin HEAD
```

2. Generate a PR title from the commit message / change summary.
3. Create the PR against the `main` branch of `redhat-developer/rhdh-plugins` using `gh pr create`. Use the following body template (pass via HEREDOC):

```
gh pr create --repo redhat-developer/rhdh-plugins --base main --title "<pr-title>" --body "$(cat <<'EOF'
## Description
<generated description of the feature/change — 2-4 sentences explaining what changed and why>

## Fixed
- <Jira link — ask the user for the Jira ticket URL, or leave as TODO if not provided>

## ✔️ Checklist
- [x] A changeset describing the change and affected packages. ([more info](https://github.com/redhat-developer/rhdh-plugins/blob/main/CONTRIBUTING.md#creating-changesets))
- [ ] Added or Updated documentation
- [ ] Tests for new functionality and regression tests for bug fixes
- [ ] Screenshots attached (for UI changes)

EOF
)"
```

4. If the PR is created successfully, **clearly display the PR URL** to the user as the final output so they can open it directly.

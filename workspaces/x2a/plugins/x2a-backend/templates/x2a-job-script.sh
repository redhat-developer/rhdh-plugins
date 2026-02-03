#!/bin/bash
set -euo pipefail

echo "=== X2A ${PHASE} Phase Starting ==="
echo "Project ID: ${PROJECT_ID}"
echo "Module ID: ${MODULE_ID}"
echo "Job ID: ${JOB_ID}"

# Configure git
git config --global user.name "${GIT_AUTHOR_NAME}"
git config --global user.email "${GIT_AUTHOR_EMAIL}"

# Setup working directory in target repo
cd /workspace/target
PROJECT_DIR="${PROJECT_ID}.${PROJECT_ABBREV}"
mkdir -p "${PROJECT_DIR}"

# Phase-specific execution
case "${PHASE}" in
  init)
    echo "=== Running x2a init phase ==="
    cd "${PROJECT_DIR}"

    uv run /app/app.py init \
      --source-dir /workspace/source \
      "${USER_PROMPT}"

    # Verify output
    if [ ! -f migration-plan.md ]; then
      echo "ERROR: migration-plan.md not created by x2a init"
      exit 1
    fi

    ARTIFACT_PATH="${PROJECT_DIR}/migration-plan.md"
    ;;

  analyze)
    echo "=== Running x2a analyze phase ==="
    mkdir -p "${PROJECT_DIR}/modules/${MODULE_NAME}"
    cd "${PROJECT_DIR}/modules/${MODULE_NAME}"

    uv run /app/app.py analyze \
      --source-dir /workspace/source \
      "${USER_PROMPT}"

    # Verify output
    if [ ! -f module_migration-plan.md ]; then
      echo "ERROR: module_migration-plan.md not created by x2a analyze"
      exit 1
    fi

    ARTIFACT_PATH="${PROJECT_DIR}/modules/${MODULE_NAME}/module_migration-plan.md"
    ;;

  migrate)
    echo "=== Running x2a migrate phase ==="
    mkdir -p "${PROJECT_DIR}/modules/${MODULE_NAME}"
    cd "${PROJECT_DIR}/modules/${MODULE_NAME}"

    uv run /app/app.py migrate \
      --source-dir /workspace/source \
      --source-technology Chef \
      --high-level-migration-plan /workspace/target/${PROJECT_DIR}/migration-plan.md \
      --module-migration-plan /workspace/target/${PROJECT_DIR}/modules/${MODULE_NAME}/module_migration-plan.md \
      "${USER_PROMPT}"

    # Verify output
    if [ ! -d migrated_ansible ]; then
      echo "ERROR: migrated_ansible directory not created by x2a migrate"
      exit 1
    fi

    ARTIFACT_PATH="${PROJECT_DIR}/modules/${MODULE_NAME}/migrated_ansible"
    ;;

  *)
    echo "ERROR: Unknown phase ${PHASE}"
    exit 1
    ;;
esac

echo "=== X2A execution completed successfully ==="

# Git commit
echo "=== Committing changes to git ==="
cd /workspace/target
git add "${PROJECT_DIR}"

git commit -m "feat(x2a): ${PHASE} phase for ${MODULE_NAME:-project}

Phase: ${PHASE}
Project: ${PROJECT_ID}
Module: ${MODULE_NAME:-N/A}
Job: ${JOB_ID}

Co-Authored-By: ${GIT_AUTHOR_NAME} <${GIT_AUTHOR_EMAIL}>
"

# Git push with conflict detection
echo "=== Pushing to remote repository ==="
git push --force-with-lease origin "${TARGET_REPO_BRANCH}"

if [ $? -ne 0 ]; then
  echo "ERROR: Git push failed - possible concurrent modification"

  # Callback with error
  curl -s -X POST "${CALLBACK_URL}" \
    -H "Authorization: Bearer ${CALLBACK_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"status\": \"error\",
      \"phase\": \"${PHASE}\",
      \"errorDetails\": \"GitPushConflict: Remote repository changed during job execution. Please retry.\"
    }" || true

  exit 1
fi

echo "=== Git push successful ==="

# Build artifact URL
ARTIFACT_URL="https://${TARGET_REPO_URL}/blob/${TARGET_REPO_BRANCH}/${ARTIFACT_PATH}"

# Callback to backend with success
echo "=== Calling collectArtifacts callback ==="
HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/callback_response.json -X POST "${CALLBACK_URL}" \
  -H "Authorization: Bearer ${CALLBACK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"success\",
    \"phase\": \"${PHASE}\",
    \"artifacts\": [\"${ARTIFACT_URL}\"]
  }")

if [ "${HTTP_CODE}" != "200" ] && [ "${HTTP_CODE}" != "201" ]; then
  echo "WARNING: Callback failed with HTTP ${HTTP_CODE}"
  cat /tmp/callback_response.json
  exit 1
fi

echo "=== X2A ${PHASE} phase completed successfully ==="

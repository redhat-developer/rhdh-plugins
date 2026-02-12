#!/bin/bash
set -eo pipefail

# Track error context for the cleanup trap
ERROR_MESSAGE=""
ARTIFACTS=()

# Report job result back to the backend.
# TODO: Incorporate CALLBACK_TOKEN for request signing (HMAC-SHA256).
# See collectArtifacts.ts:85-90 for the planned signature validation.
report_result() {
  local status="$1"
  local message="$2"

  # CALLBACK_URL already contains projectId in path
  # Append phase (required) and moduleId (required for non-init) as query params
  local url="${CALLBACK_URL}?phase=${PHASE}"
  if [ -n "${MODULE_ID:-}" ]; then
    url="${url}&moduleId=${MODULE_ID}"
  fi

  local cmd=(uv run app.py report --url "${url}" --job-id "${JOB_ID}")

  for artifact in "${ARTIFACTS[@]}"; do
    cmd+=(--artifacts "${artifact}")
  done

  if [ "${status}" = "error" ] && [ -n "${message}" ]; then
    cmd+=(--error-message "${message}")
  fi

  echo "Reporting result: status=${status}, phase=${PHASE}"
  cd /app && "${cmd[@]}" || echo "WARNING: Failed to report result to backend"
}

# Cleanup trap: fires on every exit (success or failure).
# Guarantees exactly one report_result call regardless of how the script ends.
cleanup() {
  local exit_code=$?
  set +e

  # Always try to commit and push whatever is in the working directory
  if [ -d /workspace/target/.git ]; then
    cd /workspace/target
    git add "${PROJECT_DIR:-${PROJECT_ID}.${PROJECT_ABBREV}}" 2>/dev/null || git add -A || true
    git commit -m "x2a: ${PHASE} phase for ${MODULE_NAME:-project}

Phase: ${PHASE}
Project: ${PROJECT_ID}
Module: ${MODULE_NAME:-N/A}
Job: ${JOB_ID}

Co-Authored-By: ${GIT_AUTHOR_NAME} <${GIT_AUTHOR_EMAIL}>
" || true
    git pull --rebase origin "${TARGET_REPO_BRANCH}" 2>/dev/null || true
    git push origin "${TARGET_REPO_BRANCH}" || true
  fi

  if [ ${exit_code} -ne 0 ]; then
    report_result "error" "${ERROR_MESSAGE:-Script failed with exit code ${exit_code}}"
  else
    report_result "success" ""
  fi
}

git_clone_repos() {
  echo "=== Cloning source repository ==="
  ERROR_MESSAGE="Failed to clone source repository from ${SOURCE_REPO_URL}"
  git clone --depth=1 --single-branch --branch="${SOURCE_REPO_BRANCH}" \
    "https://${SOURCE_REPO_TOKEN}@${SOURCE_REPO_URL#https://}" \
    /workspace/source

  echo "=== Cloning target repository ==="
  local target_auth_url="https://${TARGET_REPO_TOKEN}@${TARGET_REPO_URL#https://}"

  if git ls-remote "${target_auth_url}" &>/dev/null; then
    if git ls-remote --exit-code --heads "${target_auth_url}" "${TARGET_REPO_BRANCH}" &>/dev/null; then
      # Repo exists, branch exists — clone normally
      ERROR_MESSAGE="Failed to clone target repository from ${TARGET_REPO_URL}"
      git clone --depth=1 --single-branch --branch="${TARGET_REPO_BRANCH}" \
        "${target_auth_url}" /workspace/target
    else
      # Repo exists, branch doesn't — clone default branch, create target branch locally
      echo "Branch '${TARGET_REPO_BRANCH}' not found on remote, creating it"
      ERROR_MESSAGE="Failed to clone target repository from ${TARGET_REPO_URL}"
      git clone --depth=1 "${target_auth_url}" /workspace/target
      cd /workspace/target
      git checkout -b "${TARGET_REPO_BRANCH}"
    fi
  else
    echo "Target repo doesn't exist, initializing empty repo"
    mkdir -p /workspace/target
    cd /workspace/target
    git init
    git checkout -b "${TARGET_REPO_BRANCH}"
    git remote add origin "${target_auth_url}"
  fi

  ERROR_MESSAGE=""
  echo "=== Git clone completed ==="
}

trap cleanup EXIT

#
# X2A Job Script
#
# Directory Structure:
# /workspace/
# ├── source/              # Cloned source repo (input)
# │   ├── [source code]    # Original Chef/Puppet/etc code
# │   └── [x2a outputs]    # x2a tool writes here (migration-plan.md, etc)
# └── target/              # Cloned target repo (output, committed to git)
#     └── [PROJECT_ID].[PROJECT_ABBREV]/
#         ├── migration-plan.md
#         └── modules/[MODULE_NAME]/
#             ├── migration-plan-{module_name}.md
#             └── migrated_ansible/
#
# /app/                    # x2a tool installation
#

echo "=========================================="
echo "  X2A ${PHASE} Phase"
echo "=========================================="
echo ""
echo "Job Configuration:"
echo "  Project ID:    ${PROJECT_ID}"
echo "  Project Abbrev: ${PROJECT_ABBREV}"
echo "  Module ID:     ${MODULE_ID:-N/A}"
echo "  Module Name:   ${MODULE_NAME:-N/A}"
echo "  Job ID:        ${JOB_ID}"
echo "  Phase:         ${PHASE}"
echo ""

# Configure git
git config --global user.name "${GIT_AUTHOR_NAME}"
git config --global user.email "${GIT_AUTHOR_EMAIL}"

# Clone repositories
git_clone_repos

# Define paths
TARGET_BASE="/workspace/target"
SOURCE_BASE="/workspace/source"
PROJECT_DIR="${PROJECT_ID}.${PROJECT_ABBREV}"
PROJECT_PATH="${TARGET_BASE}/${PROJECT_DIR}"

# Create project directory in target
mkdir -p "${PROJECT_PATH}"

# Phase-specific execution
case "${PHASE}" in
  init)
    echo "=== Running x2a init phase ==="
    echo ""
    echo "Will read from:  ${SOURCE_BASE}"
    echo "Will write to:   ${PROJECT_PATH}/migration-plan.md"
    echo ""

    # Check if x2a tool is available (required)
    if [ ! -d /app ] || [ ! -f /app/app.py ]; then
      ERROR_MESSAGE="/app/app.py not found - x2a tool is required"
      exit 1
    fi

    echo "Running x2a tool from /app..."

    # uv run must be executed from /app where pyproject.toml is located
    # The x2a tool writes output to the current directory
    cd /app
    echo "Working directory: $(pwd)"

    # Run the init command
    # Usage: app.py init [OPTIONS] USER_REQUIREMENTS
    #   --source-dir DIRECTORY  Source directory to analyze
    USER_REQ="${USER_PROMPT:-Analyze the Chef cookbooks and create a migration plan}"
    echo "Command: uv run app.py init --source-dir ${SOURCE_BASE} \"${USER_REQ}\""
    uv run app.py init --source-dir "${SOURCE_BASE}" "${USER_REQ}"

    # Copy output to target location
    # Note: x2a tool writes files to the source directory (--source-dir)
    echo "Copying output to ${PROJECT_PATH}/"
    cp -v "${SOURCE_BASE}/migration-plan.md" "${PROJECT_PATH}/"
    # Copy any other generated files (like metadata)
    cp -v "${SOURCE_BASE}"/*.json "${PROJECT_PATH}/" 2>/dev/null || true
    cp -v "${SOURCE_BASE}"/*.yaml "${PROJECT_PATH}/" 2>/dev/null || true

    # Show what was created
    echo ""
    echo "=== Output directory contents ==="
    ls -la "${PROJECT_PATH}/"

    # Verify output
    if [ ! -f "${PROJECT_PATH}/migration-plan.md" ]; then
      ERROR_MESSAGE="migration-plan.md not created by init phase"
      exit 1
    fi

    ARTIFACTS+=("migration_plan:${PROJECT_DIR}/migration-plan.md")
    ;;

  analyze)
    echo "=== Running x2a analyze phase ==="
    MODULE_NAME_SANITIZED=$(echo "${MODULE_NAME}" | tr ' ' '_')
    OUTPUT_DIR="${PROJECT_PATH}/modules/${MODULE_NAME}"
    mkdir -p "${OUTPUT_DIR}"

    echo ""
    echo "Will read from:  ${SOURCE_BASE}"
    echo "Will write to:   ${OUTPUT_DIR}/migration-plan-${MODULE_NAME_SANITIZED}.md"
    echo ""

    # Copy migration-plan.md from target repo to source dir
    # The x2a tool does os.chdir(source_dir) and reads migration-plan.md from there
    if [ ! -f "${PROJECT_PATH}/migration-plan.md" ]; then
      ERROR_MESSAGE="migration-plan.md not found in ${PROJECT_PATH}/ - init phase must be run first"
      exit 1
    fi
    echo "Copying migration-plan.md from target to source directory..."
    cp -v "${PROJECT_PATH}/migration-plan.md" "${SOURCE_BASE}/migration-plan.md"

    # Check if x2a tool is available (required)
    if [ ! -d /app ] || [ ! -f /app/app.py ]; then
      ERROR_MESSAGE="/app/app.py not found - x2a tool is required"
      exit 1
    fi

    echo "Running x2a tool from /app..."

    # uv run must be executed from /app where pyproject.toml is located
    cd /app
    echo "Working directory: $(pwd)"

    USER_REQ="${USER_PROMPT:-Analyze the module '${MODULE_NAME}' for migration to Ansible}"
    echo "Command: uv run app.py analyze --source-dir ${SOURCE_BASE} \"${USER_REQ}\""
    uv run app.py analyze --source-dir "${SOURCE_BASE}" "${USER_REQ}"

    # Copy output to target location
    # Note: x2a tool produces migration-plan-{module_name}.md (spaces replaced with underscores)
    echo "Copying output to ${OUTPUT_DIR}/"
    cp -v "${SOURCE_BASE}/migration-plan-${MODULE_NAME_SANITIZED}.md" "${OUTPUT_DIR}/"
    cp -v "${SOURCE_BASE}"/*.json "${OUTPUT_DIR}/" 2>/dev/null || true
    cp -v "${SOURCE_BASE}"/*.yaml "${OUTPUT_DIR}/" 2>/dev/null || true

    echo ""
    echo "=== Output directory contents ==="
    ls -la "${OUTPUT_DIR}/"

    if [ ! -f "${OUTPUT_DIR}/migration-plan-${MODULE_NAME_SANITIZED}.md" ]; then
      ERROR_MESSAGE="migration-plan-${MODULE_NAME_SANITIZED}.md not created by analyze phase"
      exit 1
    fi

    ARTIFACTS+=("module_migration_plan:${PROJECT_DIR}/modules/${MODULE_NAME}/migration-plan-${MODULE_NAME_SANITIZED}.md")
    ;;

  migrate)
    echo "=== Running x2a migrate phase ==="
    MODULE_NAME_SANITIZED=$(echo "${MODULE_NAME}" | tr ' ' '_')
    OUTPUT_DIR="${PROJECT_PATH}/modules/${MODULE_NAME}"
    mkdir -p "${OUTPUT_DIR}"

    echo ""
    echo "Will read from:  ${SOURCE_BASE}"
    echo "Will write to:   ${OUTPUT_DIR}/ansible/"
    echo ""

    # Copy migration-plan.md from target repo to source dir
    # The x2a tool does os.chdir(source_dir) and reads migration-plan.md from there
    if [ ! -f "${PROJECT_PATH}/migration-plan.md" ]; then
      ERROR_MESSAGE="migration-plan.md not found in ${PROJECT_PATH}/ - init phase must be run first"
      exit 1
    fi
    echo "Copying migration-plan.md from target to source directory..."
    cp -v "${PROJECT_PATH}/migration-plan.md" "${SOURCE_BASE}/migration-plan.md"

    # Check if x2a tool is available (required)
    if [ ! -d /app ] || [ ! -f /app/app.py ]; then
      ERROR_MESSAGE="/app/app.py not found - x2a tool is required"
      exit 1
    fi

    echo "Running x2a tool from /app..."

    # uv run must be executed from /app where pyproject.toml is located
    cd /app
    echo "Working directory: $(pwd)"

    USER_REQ="${USER_PROMPT:-Migrate this module to Ansible}"
    echo "Command: uv run app.py migrate --source-dir ${SOURCE_BASE} --source-technology Chef --high-level-migration-plan ${PROJECT_PATH}/migration-plan.md --module-migration-plan ${OUTPUT_DIR}/migration-plan-${MODULE_NAME_SANITIZED}.md \"${USER_REQ}\""
    uv run app.py migrate \
      --source-dir "${SOURCE_BASE}" \
      --source-technology Chef \
      --high-level-migration-plan "${PROJECT_PATH}/migration-plan.md" \
      --module-migration-plan "${OUTPUT_DIR}/migration-plan-${MODULE_NAME_SANITIZED}.md" \
      "${USER_REQ}"

    # Copy output to target location
    # Note: x2a tool writes to ansible/roles/{module}/ in the source directory
    echo "Copying output to ${OUTPUT_DIR}/"
    cp -rv "${SOURCE_BASE}/ansible" "${OUTPUT_DIR}/" 2>/dev/null || true
    cp -v "${SOURCE_BASE}"/*.json "${OUTPUT_DIR}/" 2>/dev/null || true
    cp -v "${SOURCE_BASE}"/*.yaml "${OUTPUT_DIR}/" 2>/dev/null || true

    echo ""
    echo "=== Output directory contents ==="
    ls -la "${OUTPUT_DIR}/"
    ls -la "${OUTPUT_DIR}/ansible/roles/" 2>/dev/null || true

    if [ ! -d "${OUTPUT_DIR}/ansible" ]; then
      ERROR_MESSAGE="ansible output directory not created by migrate phase"
      exit 1
    fi

    ARTIFACTS+=("migrated_sources:${PROJECT_DIR}/modules/${MODULE_NAME}/ansible")
    ;;

  *)
    ERROR_MESSAGE="Unknown phase: ${PHASE}"
    exit 1
    ;;
esac

echo ""
echo "=== X2A execution completed successfully ==="
echo ""
echo "=========================================="
echo "  X2A ${PHASE} phase completed!"
echo "=========================================="

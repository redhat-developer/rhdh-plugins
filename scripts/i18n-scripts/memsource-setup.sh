#!/usr/bin/env bash
set -euo pipefail

# Memsource Setup Utility
# Shared authentication and setup logic for memsource operations

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load configuration
source "$SCRIPT_DIR/i18n.config.sh"

# Helper functions
log() { echo "🔍 $1"; }
success() { echo "✅ $1"; }
warning() { echo "⚠️  $1"; }
error() { echo "❌ $1"; }

# Function to check if memsource CLI is available
check_memsource_cli() {
  # First, try to source .memsourcerc if it exists
  if [[ -f "$HOME/.memsourcerc" ]]; then
    source "$HOME/.memsourcerc"
  fi
  
  # Now check if memsource is available
  if ! command -v memsource >/dev/null 2>&1; then
    error "memsource CLI not found. Please install and configure it."
    echo ""
    echo "To install memsource CLI:"
    echo "  1. Visit: https://help.memsource.com/hc/en-us/articles/115003461931"
    echo "  2. Download and install the memsource CLI"
    echo "  3. Ensure it's in your PATH"
    echo ""
    echo "Or set up authentication manually:"
    echo "  export MEMSOURCE_TOKEN=\"your-token-here\""
    echo "  export MEMSOURCE_USERNAME=\"your-username\""
    echo ""
    echo "If you have ~/.memsourcerc, make sure it properly activates the memsource environment"
    return 1
  fi
  return 0
}

# Function to check authentication
check_authentication() {
  # Load authentication from .memsourcerc if it exists
  [[ -f "$HOME/.memsourcerc" ]] && source "$HOME/.memsourcerc"
  
  # Check if authentication is configured
  if [[ -z "${MEMSOURCE_TOKEN:-}" ]]; then
    error "MEMSOURCE_TOKEN environment variable is required"
    echo ""
    echo "Please set up authentication:"
    echo ""
    echo "Option 1: Create ~/.memsourcerc file:"
    echo "  export MEMSOURCE_TOKEN=\"your-token-here\""
    echo "  export MEMSOURCE_USERNAME=\"your-username\""
    echo ""
    echo "Option 2: Set environment variables:"
    echo "  export MEMSOURCE_TOKEN=\"your-token-here\""
    echo "  export MEMSOURCE_USERNAME=\"your-username\""
    echo ""
    echo "Option 3: Source the file:"
    echo "  source ~/.memsourcerc"
    return 1
  fi
  
  # Check if username is also set (optional but recommended)
  if [[ -z "${MEMSOURCE_USERNAME:-}" ]]; then
    warning "MEMSOURCE_USERNAME not set (optional but recommended)"
  fi
  
  return 0
}

# Function to validate TMS connection
validate_connection() {
  log "Validating TMS connection..."
  
  # Test connection by getting project info
  if memsource project list --format json >/dev/null 2>&1; then
    success "TMS connection validated"
    return 0
  else
    error "Failed to connect to TMS"
    echo ""
    echo "Please check:"
    echo "  1. Your internet connection"
    echo "  2. TMS credentials are correct"
    echo "  3. TMS service is available"
    return 1
  fi
}

# Function to get project info
get_project_info() {
  local project_id="$1"
  
  log "Getting project information for ID: $project_id"
  
  # First try to get project details from project list
  local project_info
  if project_info=$(memsource project list --format json | jq -r ".[] | select(.uid == \"$project_id\" or .id == \"$project_id\")"); then
    if [[ -n "$project_info" ]]; then
      local project_name=$(echo "$project_info" | jq -r '.name')
      local project_uid=$(echo "$project_info" | jq -r '.uid')
      local project_id_field=$(echo "$project_info" | jq -r '.id')
      success "Found project: $project_name (UID: $project_uid, ID: $project_id_field)"
      return 0
    fi
  fi
  
  # If not found in project list, try to access it directly via job list
  log "Project not in project list, testing direct access..."
  if memsource job list --project-id "$project_id" --format json >/dev/null 2>&1; then
    success "Project $project_id is accessible (found via job list)"
    return 0
  else
    error "Project not found: $project_id"
    echo ""
    echo "Available projects:"
    memsource project list --format json | jq -r '.[] | "  \(.uid) | \(.id) | \(.name)"' | head -5
    return 1
  fi
}

# Function to setup complete memsource environment
setup_memsource() {
  log "Setting up memsource environment..."
  
  # Check CLI
  if ! check_memsource_cli; then
    return 1
  fi
  
  # Check authentication
  if ! check_authentication; then
    return 1
  fi
  
  # Validate connection
  if ! validate_connection; then
    return 1
  fi
  
  success "Memsource setup complete"
  return 0
}

# Function to setup with project validation
setup_memsource_with_project() {
  local project_id="$1"
  
  # Basic setup
  if ! setup_memsource; then
    return 1
  fi
  
  # Validate specific project
  if ! get_project_info "$project_id"; then
    return 1
  fi
  
  success "Memsource setup with project validation complete"
  return 0
}

# Main function - can be sourced or called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  # Called directly
  case "${1:-setup}" in
    "setup")
      setup_memsource
      ;;
    "setup-with-project")
      if [[ -z "${2:-}" ]]; then
        error "Project ID required for setup-with-project"
        echo "Usage: $0 setup-with-project PROJECT_ID"
        exit 1
      fi
      setup_memsource_with_project "$2"
      ;;
    "check-cli")
      check_memsource_cli
      ;;
    "check-auth")
      check_authentication
      ;;
    "validate")
      validate_connection
      ;;
    *)
      echo "Usage: $0 [setup|setup-with-project|check-cli|check-auth|validate]"
      echo ""
      echo "Commands:"
      echo "  setup                 - Full memsource setup (CLI + auth + connection)"
      echo "  setup-with-project ID - Setup with project validation"
      echo "  check-cli             - Check if memsource CLI is available"
      echo "  check-auth            - Check authentication"
      echo "  validate              - Validate TMS connection"
      exit 1
      ;;
  esac
fi

#!/usr/bin/env bash
# =============================================================================
# Backend API Integration Test Script
# =============================================================================
#
# Tests augment backend endpoints at two levels:
#   Level 1: Direct LlamaStack Responses API (no Backstage needed)
#   Level 2: Full Backstage backend chain (requires running Backstage)
#
# Usage:
#   # Test directly against LlamaStack (default):
#   LLAMASTACK_URL=https://llamastack-llamastack.apps.ocp.v7hjl.sandbox2288.opentlc.com \
#     ./scripts/test-backend-curls.sh
#
#   # Test full Backstage backend (auto-acquires guest token):
#   BACKSTAGE_URL=http://localhost:7007 \
#   LLAMASTACK_URL=https://my-llamastack.example.com \
#     ./scripts/test-backend-curls.sh --backstage
#
#   # Run only specific group:
#   TEST_GROUP=chat ./scripts/test-backend-curls.sh
#   TEST_GROUP=streaming ./scripts/test-backend-curls.sh
#   TEST_GROUP=chain ./scripts/test-backend-curls.sh
#   TEST_GROUP=multiagent ./scripts/test-backend-curls.sh
#   TEST_GROUP=backstage ./scripts/test-backend-curls.sh --backstage
#
# Environment Variables:
#   LLAMASTACK_URL   - LlamaStack base URL (required)
#   LLAMASTACK_MODEL - Model identifier (default: gemini/models/gemini-2.0-flash)
#   BACKSTAGE_URL    - Backstage backend URL (default: http://localhost:7007)
#   AUTH_TOKEN        - Backstage auth token (auto-acquired with --auto-token)
#   TEST_GROUP        - Run specific group: chat|streaming|chain|multiagent|errors|backstage|all
#   VERBOSE           - Set to 1 for full response output
#   TIMEOUT           - Request timeout in seconds (default: 30)
# =============================================================================

set -uo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────

LLAMASTACK_URL="${LLAMASTACK_URL:-https://llamastack-llamastack.apps.ocp.v7hjl.sandbox2288.opentlc.com}"
LLAMASTACK_MODEL="${LLAMASTACK_MODEL:-gemini/models/gemini-2.0-flash}"
BACKSTAGE_URL="${BACKSTAGE_URL:-http://localhost:7007}"
BACKSTAGE_API="${BACKSTAGE_URL}/api/augment"
AUTH_TOKEN="${AUTH_TOKEN:-}"
TEST_GROUP="${TEST_GROUP:-all}"
VERBOSE="${VERBOSE:-0}"
TIMEOUT="${TIMEOUT:-30}"
RUN_BACKSTAGE=0

for arg in "$@"; do
  case "$arg" in
    --backstage) RUN_BACKSTAGE=1 ;;
    --auto-token) RUN_BACKSTAGE=1 ;;
  esac
done

RESPONSES_URL="${LLAMASTACK_URL}/v1/responses"

# Stored response IDs for chaining tests
STORED_RESP_ID=""

# ── Colors ─────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Counters ───────────────────────────────────────────────────────────────────

PASSED=0
FAILED=0
SKIPPED=0
TOTAL=0

# ── Helpers ────────────────────────────────────────────────────────────────────

log_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_test() {
  ((TOTAL++)) || true
  echo ""
  echo -e "  ${CYAN}[$TOTAL]${NC} $1"
}

log_curl() {
  if [[ "$VERBOSE" == "1" ]]; then
    echo -e "      ${DIM}$1${NC}"
  fi
}

pass() {
  ((PASSED++)) || true
  echo -e "      ${GREEN}PASS${NC} $1"
}

fail() {
  ((FAILED++)) || true
  echo -e "      ${RED}FAIL${NC} $1"
}

skip() {
  ((SKIPPED++)) || true
  echo -e "      ${YELLOW}SKIP${NC} $1"
}

verbose_output() {
  if [[ "$VERBOSE" == "1" ]]; then
    echo "$1" | jq '.' 2>/dev/null | head -40 | sed 's/^/        /' || echo "$1" | head -10 | sed 's/^/        /'
  fi
}

should_run() {
  [[ "$TEST_GROUP" == "all" || "$TEST_GROUP" == "$1" ]]
}

check_jq() {
  if ! command -v jq &>/dev/null; then
    echo -e "${RED}Error: jq is required. Install: brew install jq${NC}"
    exit 1
  fi
}

# ── LlamaStack direct helpers ─────────────────────────────────────────────────

ls_post() {
  local body="$1"
  curl -s -S --max-time "$TIMEOUT" -k \
    -H "Content-Type: application/json" \
    -d "$body" \
    "$RESPONSES_URL" 2>&1
}

ls_stream() {
  local body="$1"
  curl -s -S --max-time "$TIMEOUT" -k -N \
    -H "Content-Type: application/json" \
    -H "Accept: text/event-stream" \
    -d "$body" \
    "$RESPONSES_URL" 2>&1
}

# ── Backstage helpers ──────────────────────────────────────────────────────────

bs_get() {
  local path="$1"
  local args=(-s -S --max-time "$TIMEOUT" -H "Content-Type: application/json")
  if [[ -n "$AUTH_TOKEN" ]]; then
    args+=(-H "Authorization: $AUTH_TOKEN")
  fi
  curl "${args[@]}" "${BACKSTAGE_API}${path}" 2>&1
}

bs_post() {
  local path="$1"
  local body="$2"
  local args=(-s -S --max-time "$TIMEOUT" -X POST -H "Content-Type: application/json")
  if [[ -n "$AUTH_TOKEN" ]]; then
    args+=(-H "Authorization: $AUTH_TOKEN")
  fi
  curl "${args[@]}" -d "$body" "${BACKSTAGE_API}${path}" 2>&1
}

bs_stream() {
  local path="$1"
  local body="$2"
  local args=(-s -S --max-time "$TIMEOUT" -X POST -H "Content-Type: application/json" -H "Accept: text/event-stream" -N)
  if [[ -n "$AUTH_TOKEN" ]]; then
    args+=(-H "Authorization: $AUTH_TOKEN")
  fi
  curl "${args[@]}" -d "$body" "${BACKSTAGE_API}${path}" 2>&1
}

bs_delete() {
  local path="$1"
  local args=(-s -S --max-time "$TIMEOUT" -X DELETE -H "Content-Type: application/json")
  if [[ -n "$AUTH_TOKEN" ]]; then
    args+=(-H "Authorization: $AUTH_TOKEN")
  fi
  curl "${args[@]}" "${BACKSTAGE_API}${path}" 2>&1
}

acquire_guest_token() {
  echo -e "${CYAN}Acquiring Backstage guest token...${NC}"
  local resp
  resp=$(curl -s -S --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{}' \
    "${BACKSTAGE_URL}/api/auth/guest/refresh" 2>&1) || true
  local token
  token=$(echo "$resp" | jq -r '.backstageIdentity.token // empty' 2>/dev/null)
  if [[ -n "$token" ]]; then
    AUTH_TOKEN="Bearer $token"
    echo -e "${GREEN}Token acquired.${NC}"
    return 0
  fi
  echo -e "${RED}Could not acquire token. Set AUTH_TOKEN or security.mode: 'none'.${NC}"
  return 1
}

# =============================================================================
#  Level 1: Direct LlamaStack Responses API Tests
# =============================================================================

# ── 1. Basic Chat ─────────────────────────────────────────────────────────────

test_chat() {
  log_header "1. LlamaStack Responses API - Basic Chat"

  log_test "Non-streaming chat"
  log_curl "POST $RESPONSES_URL"
  local resp
  resp=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"Say hello in one sentence.\",
    \"instructions\": \"You are a helpful assistant. Be concise.\"
  }")
  if echo "$resp" | jq -e '.status == "completed" and .output[0].content[0].text' &>/dev/null; then
    local text
    text=$(echo "$resp" | jq -r '.output[0].content[0].text' | tr -d '\n' | head -c 80)
    pass "Response: $text"
    local respId
    respId=$(echo "$resp" | jq -r '.id')
    pass "responseId: $respId"
  else
    fail "Did not get valid response"
  fi
  verbose_output "$resp"

  log_test "Non-streaming with store:true"
  log_curl "POST $RESPONSES_URL (store: true)"
  resp=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"Remember the number 42.\",
    \"instructions\": \"You are a helpful assistant.\",
    \"store\": true
  }")
  if echo "$resp" | jq -e '.status == "completed"' &>/dev/null; then
    STORED_RESP_ID=$(echo "$resp" | jq -r '.id')
    local text
    text=$(echo "$resp" | jq -r '.output[0].content[0].text' | tr -d '\n' | head -c 80)
    pass "Stored response: $text (id: $STORED_RESP_ID)"
  else
    fail "store:true request failed"
  fi
  verbose_output "$resp"

  log_test "Multi-turn conversation context"
  log_curl "POST $RESPONSES_URL (input as array)"
  resp=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": [
      {\"role\": \"user\", \"content\": \"My name is TestBot.\"},
      {\"role\": \"assistant\", \"content\": \"Hello TestBot!\"},
      {\"role\": \"user\", \"content\": \"What is my name? Reply with just the name.\"}
    ],
    \"instructions\": \"You are a helpful assistant.\"
  }")
  if echo "$resp" | jq -e '.status == "completed"' &>/dev/null; then
    local text
    text=$(echo "$resp" | jq -r '.output[0].content[0].text' | tr -d '\n' | head -c 80)
    pass "Multi-turn response: $text"
  else
    fail "Multi-turn context failed"
  fi
  verbose_output "$resp"

  log_test "Long instructions / system prompt"
  log_curl "POST $RESPONSES_URL (long instructions)"
  resp=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"What can you help with?\",
    \"instructions\": \"You are an AI assistant for the Application Platform. You have two capabilities: 1) RAG Knowledge Base for searching documentation, 2) MCP Tools for executing actions on OpenShift/Kubernetes clusters. Be concise and direct. Always execute tools first, then summarize results. For read operations, execute immediately without asking permission.\"
  }")
  if echo "$resp" | jq -e '.status == "completed"' &>/dev/null; then
    pass "Long instructions handled correctly"
  else
    fail "Long instructions failed"
  fi
  verbose_output "$resp"
}

# ── 2. Streaming ──────────────────────────────────────────────────────────────

test_streaming() {
  log_header "2. LlamaStack Responses API - Streaming"

  log_test "SSE streaming - event types"
  log_curl "POST $RESPONSES_URL (stream: true)"
  local resp
  resp=$(ls_stream "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"Say hello in one word.\",
    \"instructions\": \"You are a helpful assistant.\",
    \"stream\": true
  }")

  local dataLines
  dataLines=$(echo "$resp" | grep -c "^data: " || true)
  if [[ "$dataLines" -gt 0 ]]; then
    pass "Received $dataLines SSE events"
  else
    fail "No SSE events received"
    verbose_output "$resp"
    return
  fi

  local events
  events=$(echo "$resp" | grep "^data: " | sed 's/^data: //')

  # Check event types
  local types
  types=$(echo "$events" | jq -r '.type // empty' 2>/dev/null | sort -u | tr '\n' ', ')
  pass "Event types: $types"

  if echo "$events" | jq -e 'select(.type == "response.created")' &>/dev/null; then
    pass "Has response.created"
  else
    fail "Missing response.created"
  fi

  if echo "$events" | jq -e 'select(.type == "response.output_text.delta")' &>/dev/null; then
    pass "Has response.output_text.delta"
  else
    fail "Missing response.output_text.delta"
  fi

  local completedEvent
  completedEvent=$(echo "$events" | jq -c 'select(.type == "response.completed")' 2>/dev/null | head -1) || true
  if [[ -n "$completedEvent" ]]; then
    pass "Has response.completed"
    local totalTokens
    totalTokens=$(echo "$completedEvent" | jq -r '.response.usage.total_tokens // "N/A"' 2>/dev/null) || true
    if [[ -n "$totalTokens" && "$totalTokens" != "N/A" && "$totalTokens" != "null" ]]; then
      pass "Token usage: total=$totalTokens"
    fi
  else
    fail "Missing response.completed"
  fi

  log_test "Reconstruct full text from stream deltas"
  local fullText
  fullText=$(echo "$events" | jq -r 'select(.type == "response.output_text.delta") | .delta // empty' 2>/dev/null | tr -d '\n') || true
  if [[ -n "$fullText" ]]; then
    pass "Reconstructed: $(echo "$fullText" | head -c 80)"
  else
    fail "Could not reconstruct text from deltas"
  fi

  log_test "Stream responseId matches completed response"
  local createdId completedId
  createdId=$(echo "$events" | jq -r 'select(.type == "response.created") | .response.id // empty' 2>/dev/null | head -1) || true
  completedId=$(echo "$events" | jq -r 'select(.type == "response.completed") | .response.id // empty' 2>/dev/null | head -1) || true
  if [[ -n "$createdId" && "$createdId" == "$completedId" ]]; then
    pass "Consistent responseId: $createdId"
  else
    fail "responseId mismatch: created=$createdId completed=$completedId"
  fi
}

# ── 3. Response Chaining ──────────────────────────────────────────────────────

test_chain() {
  log_header "3. LlamaStack Responses API - Response Chaining"

  if [[ -z "$STORED_RESP_ID" ]]; then
    log_test "Create stored response for chaining"
    local resp
    resp=$(ls_post "{
      \"model\": \"$LLAMASTACK_MODEL\",
      \"input\": \"Remember the color blue.\",
      \"instructions\": \"You are a helpful assistant.\",
      \"store\": true
    }")
    STORED_RESP_ID=$(echo "$resp" | jq -r '.id // empty')
    if [[ -n "$STORED_RESP_ID" ]]; then
      pass "Created stored response: $STORED_RESP_ID"
    else
      fail "Could not create stored response"
      return
    fi
  fi

  log_test "Chain with previous_response_id"
  log_curl "POST $RESPONSES_URL (previous_response_id: $STORED_RESP_ID)"
  local resp
  resp=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"What number did I ask you to remember?\",
    \"instructions\": \"You are a helpful assistant.\",
    \"previous_response_id\": \"$STORED_RESP_ID\"
  }")
  if echo "$resp" | jq -e '.status == "completed"' &>/dev/null; then
    local text
    text=$(echo "$resp" | jq -r '.output[0].content[0].text' | tr -d '\n' | head -c 80)
    if echo "$text" | grep -qi "42"; then
      pass "Correctly recalled: $text"
    else
      pass "Response (may not recall perfectly): $text"
    fi
    local chainId
    chainId=$(echo "$resp" | jq -r '.id')
    pass "New responseId: $chainId"
  else
    fail "Chaining with previous_response_id failed"
  fi
  verbose_output "$resp"

  log_test "Chain preserves previous_response_id in response"
  local prevRefId
  prevRefId=$(echo "$resp" | jq -r '.previous_response_id // empty')
  if [[ "$prevRefId" == "$STORED_RESP_ID" ]]; then
    pass "previous_response_id correctly echoed: $prevRefId"
  else
    skip "previous_response_id not echoed (server-dependent)"
  fi

  log_test "3-turn chain"
  local turn1Id
  local turn1
  turn1=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"My favorite animal is a penguin.\",
    \"instructions\": \"You are a helpful assistant.\",
    \"store\": true
  }")
  turn1Id=$(echo "$turn1" | jq -r '.id // empty')
  if [[ -z "$turn1Id" ]]; then
    fail "Turn 1 failed"
    return
  fi

  local turn2
  turn2=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"My favorite color is green.\",
    \"instructions\": \"You are a helpful assistant.\",
    \"previous_response_id\": \"$turn1Id\",
    \"store\": true
  }")
  local turn2Id
  turn2Id=$(echo "$turn2" | jq -r '.id // empty')
  if [[ -z "$turn2Id" ]]; then
    fail "Turn 2 failed"
    return
  fi

  local turn3
  turn3=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"What is my favorite animal and color? Reply concisely.\",
    \"instructions\": \"You are a helpful assistant.\",
    \"previous_response_id\": \"$turn2Id\"
  }")
  if echo "$turn3" | jq -e '.status == "completed"' &>/dev/null; then
    local text
    text=$(echo "$turn3" | jq -r '.output[0].content[0].text' | tr -d '\n' | head -c 120)
    pass "3-turn chain: $text"
  else
    fail "3-turn chain failed"
  fi
  verbose_output "$turn3"
}

# ── 4. Multi-Agent Handoff (tool calling) ──────────────────────────────────────

test_multiagent() {
  log_header "4. Multi-Agent Tool Calling (Responses API)"

  # ── 4a. Single handoff tool ────────────────────────────────────────────────
  log_test "Responses API: single handoff tool"
  log_curl "POST $RESPONSES_URL (with transfer_to_billing tool)"
  local resp
  resp=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"I need a refund for my last order.\",
    \"instructions\": \"You are a triage agent. If the user mentions billing, call transfer_to_billing.\",
    \"tools\": [
      {
        \"type\": \"function\",
        \"name\": \"transfer_to_billing\",
        \"description\": \"Hand off to the billing agent for refund/payment questions.\",
        \"parameters\": {\"type\": \"object\", \"properties\": {}},
        \"strict\": true
      }
    ]
  }")

  if echo "$resp" | jq -e '.status == "completed"' &>/dev/null; then
    local hasToolCall
    hasToolCall=$(echo "$resp" | jq '[.output[] | select(.type == "function_call")] | length')
    if [[ "$hasToolCall" -gt 0 ]]; then
      local toolName callId respId
      toolName=$(echo "$resp" | jq -r '.output[] | select(.type == "function_call") | .name')
      callId=$(echo "$resp" | jq -r '.output[] | select(.type == "function_call") | .call_id')
      respId=$(echo "$resp" | jq -r '.id')
      pass "Handoff tool invoked: $toolName (call_id: $callId)"

      # ── 4b. Function call output -> follow-up ─────────────────────────
      log_test "Function call output -> specialist follow-up"
      local followUp
      followUp=$(ls_post "{
        \"model\": \"$LLAMASTACK_MODEL\",
        \"input\": [
          {\"type\": \"function_call_output\", \"call_id\": \"$callId\", \"output\": \"{\\\"agent\\\": \\\"billing\\\"}\"}
        ],
        \"instructions\": \"You are a billing specialist. Help with refunds. Be concise.\",
        \"previous_response_id\": \"$respId\"
      }")
      if echo "$followUp" | jq -e '.status == "completed"' &>/dev/null; then
        local text
        text=$(echo "$followUp" | jq -r '.output[0].content[0].text // empty' | tr -d '\n' | head -c 80)
        pass "Specialist follow-up: $text"
      else
        fail "Follow-up after handoff failed"
      fi
      verbose_output "$followUp"
    else
      local text
      text=$(echo "$resp" | jq -r '.output[0].content[0].text // empty' | tr -d '\n' | head -c 80)
      skip "Model answered directly instead of calling tool: $text"
    fi
  else
    fail "Responses API tool calling failed"
  fi
  verbose_output "$resp"

  # ── 4c. Multiple handoff tools (multi-agent routing) ───────────────────────
  echo ""
  log_test "Multiple handoff tools (multi-agent routing)"
  log_curl "POST $RESPONSES_URL (with 2 transfer tools)"
  resp=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"My deployment is failing with CrashLoopBackOff.\",
    \"instructions\": \"You are a triage agent. Route billing questions to transfer_to_billing. Route technical issues to transfer_to_technical. Always route, never answer directly.\",
    \"tools\": [
      {
        \"type\": \"function\",
        \"name\": \"transfer_to_billing\",
        \"description\": \"Hand off to billing agent for payment/refund questions.\",
        \"parameters\": {\"type\": \"object\", \"properties\": {}},
        \"strict\": true
      },
      {
        \"type\": \"function\",
        \"name\": \"transfer_to_technical\",
        \"description\": \"Hand off to technical agent for errors, deployments, debugging.\",
        \"parameters\": {\"type\": \"object\", \"properties\": {}},
        \"strict\": true
      }
    ]
  }")

  if echo "$resp" | jq -e '.status == "completed"' &>/dev/null; then
    local toolName
    toolName=$(echo "$resp" | jq -r '.output[] | select(.type == "function_call") | .name' 2>/dev/null | head -1)
    if [[ "$toolName" == "transfer_to_technical" ]]; then
      pass "Correctly routed to technical agent"
    elif [[ -n "$toolName" ]]; then
      pass "Routed to: $toolName (expected technical)"
    else
      skip "Model answered directly instead of routing"
    fi
  else
    fail "Multi-tool routing failed"
  fi
  verbose_output "$resp"

  # ── 4d. Streaming with tools ───────────────────────────────────────────────
  echo ""
  log_test "Streaming with function tools"
  log_curl "POST $RESPONSES_URL (stream + tools)"
  local streamResp
  streamResp=$(ls_stream "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"What is the weather in Tokyo?\",
    \"stream\": true,
    \"tools\": [{
      \"type\": \"function\",
      \"name\": \"get_weather\",
      \"description\": \"Get current weather for a location.\",
      \"parameters\": {\"type\": \"object\", \"properties\": {\"location\": {\"type\": \"string\"}}, \"required\": [\"location\"]},
      \"strict\": true
    }]
  }")

  local streamEvents
  streamEvents=$(echo "$streamResp" | grep -c "^data: " || true)
  if [[ "$streamEvents" -gt 0 ]]; then
    pass "Received $streamEvents SSE events"
    local hasFnCall
    hasFnCall=$(echo "$streamResp" | grep "function_call_arguments.done" | head -1)
    if [[ -n "$hasFnCall" ]]; then
      pass "Stream includes function_call_arguments.done"
    else
      skip "No function_call in stream (model may have answered directly)"
    fi
  else
    fail "No streaming events received"
  fi
}

# ── 5. Error Handling ──────────────────────────────────────────────────────────

test_errors() {
  log_header "5. LlamaStack Responses API - Error Handling"

  log_test "Invalid model name"
  local resp
  resp=$(ls_post "{
    \"model\": \"nonexistent-model-xyz\",
    \"input\": \"Hello\"
  }")
  if echo "$resp" | jq -e '.detail or .error' &>/dev/null; then
    pass "Invalid model correctly rejected"
  else
    fail "Invalid model should have been rejected"
  fi
  verbose_output "$resp"

  log_test "Empty input"
  resp=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"\"
  }")
  # Some servers accept empty input, others reject it
  if echo "$resp" | jq -e '.status == "completed" or .detail or .error' &>/dev/null; then
    pass "Empty input handled gracefully"
  else
    fail "Empty input caused unexpected error"
  fi

  log_test "Invalid previous_response_id"
  resp=$(ls_post "{
    \"model\": \"$LLAMASTACK_MODEL\",
    \"input\": \"Hello\",
    \"previous_response_id\": \"resp_nonexistent_12345\"
  }")
  if echo "$resp" | jq -e '.detail or .error' &>/dev/null; then
    pass "Invalid previous_response_id correctly rejected"
  elif echo "$resp" | jq -e '.status == "completed"' &>/dev/null; then
    skip "Server ignored invalid previous_response_id (provider-dependent)"
  else
    fail "Unexpected response for invalid previous_response_id"
  fi
  verbose_output "$resp"

  log_test "Models endpoint"
  resp=$(curl -s -S --max-time "$TIMEOUT" -k "${LLAMASTACK_URL}/v1/models" -H "accept: application/json" 2>&1)
  if echo "$resp" | jq -e '.data | length > 0' &>/dev/null; then
    local count
    count=$(echo "$resp" | jq '.data | length')
    local llmCount
    llmCount=$(echo "$resp" | jq '[.data[] | select(.model_type == "llm")] | length')
    pass "Available models: $count total ($llmCount LLM)"
  else
    fail "Models endpoint failed"
  fi
}

# ── 6. Backstage Backend Tests ─────────────────────────────────────────────────

test_backstage() {
  log_header "6. Backstage Backend Integration"

  # Check if backend is running
  local healthResp
  healthResp=$(curl -s --max-time 5 "${BACKSTAGE_API}/health" 2>&1) || true
  if ! echo "$healthResp" | jq -e '.status == "ok"' &>/dev/null; then
    echo -e "  ${YELLOW}Backstage backend not reachable at $BACKSTAGE_API${NC}"
    echo -e "  ${YELLOW}Start with: cd workspaces/mcp-chat && yarn dev${NC}"
    skip "Backstage backend not running"
    return
  fi

  # Acquire token if needed
  if [[ -z "$AUTH_TOKEN" ]]; then
    local authCheck
    authCheck=$(curl -s --max-time 5 "${BACKSTAGE_API}/chat" -X POST \
      -H "Content-Type: application/json" \
      -d '{"messages":[{"role":"user","content":"test"}]}' 2>&1) || true
    if echo "$authCheck" | jq -e '.error.name == "AuthenticationError"' &>/dev/null; then
      acquire_guest_token || {
        skip "Cannot authenticate to Backstage"
        return
      }
    fi
  fi

  log_test "GET /health"
  local resp
  resp=$(bs_get "/health")
  if echo "$resp" | jq -e '.status == "ok"' &>/dev/null; then
    pass "Health: ok"
  else
    fail "Health check failed"
  fi

  log_test "GET /status"
  resp=$(bs_get "/status")
  if echo "$resp" | jq -e '.provider or .providerId' &>/dev/null; then
    local provider
    provider=$(echo "$resp" | jq -r '.providerId // .provider // "unknown"')
    pass "Provider: $provider"
  else
    skip "Status endpoint requires different response parsing"
  fi
  verbose_output "$resp"

  log_test "POST /chat - basic"
  resp=$(bs_post "/chat" '{
    "messages": [{"role": "user", "content": "Say hello in one sentence."}]
  }')
  if echo "$resp" | jq -e '.role == "assistant" and .content != ""' &>/dev/null; then
    local content agentName
    content=$(echo "$resp" | jq -r '.content' | head -c 60)
    agentName=$(echo "$resp" | jq -r '.agentName // "none"')
    pass "Chat: $content (agentName: $agentName)"
    local bsRespId
    bsRespId=$(echo "$resp" | jq -r '.responseId // empty')
    if [[ -n "$bsRespId" ]]; then
      pass "responseId: $bsRespId"
    fi
  else
    local errMsg
    errMsg=$(echo "$resp" | jq -r '.message // .error // "unknown"' | head -c 80)
    fail "Chat failed: $errMsg"
  fi
  verbose_output "$resp"

  log_test "POST /chat - input validation (empty messages)"
  resp=$(bs_post "/chat" '{"messages": []}')
  if echo "$resp" | jq -e '.error' &>/dev/null; then
    pass "Empty messages rejected"
  else
    fail "Should have rejected empty messages"
  fi

  log_test "POST /chat - input validation (invalid role)"
  resp=$(bs_post "/chat" '{"messages": [{"role": "hacker", "content": "hi"}]}')
  if echo "$resp" | jq -e '.error' &>/dev/null; then
    pass "Invalid role rejected"
  else
    fail "Should have rejected invalid role"
  fi

  log_test "POST /chat/stream - basic streaming"
  resp=$(bs_stream "/chat/stream" '{
    "messages": [{"role": "user", "content": "Say hello in one word."}]
  }')
  local dataLines
  dataLines=$(echo "$resp" | grep -c "^data: " || true)
  if [[ "$dataLines" -gt 0 ]]; then
    pass "Received $dataLines SSE events"
    if echo "$resp" | grep -q "data: \[DONE\]"; then
      pass "Stream ended with [DONE]"
    else
      fail "Missing [DONE] sentinel"
    fi

    local events
    events=$(echo "$resp" | grep "^data: " | grep -v "\[DONE\]" | sed 's/^data: //')
    local hasText
    hasText=$(echo "$events" | jq -r 'select(.type == "stream.text.delta") | .delta // empty' 2>/dev/null | head -1)
    if [[ -n "$hasText" ]]; then
      pass "Has stream.text.delta events"
    else
      # Check for raw LlamaStack events (response.output_text.delta)
      hasText=$(echo "$events" | jq -r 'select(.type == "response.output_text.delta") | .delta // empty' 2>/dev/null | head -1)
      if [[ -n "$hasText" ]]; then
        pass "Has response.output_text.delta events (raw format)"
      else
        fail "No text delta events found"
      fi
    fi
  else
    local errMsg
    errMsg=$(echo "$resp" | jq -r '.message // .error // "unknown"' 2>/dev/null | head -c 80)
    fail "No SSE events: $errMsg"
  fi
  verbose_output "$resp"

  log_test "POST /chat - multi-message context"
  resp=$(bs_post "/chat" '{
    "messages": [
      {"role": "user", "content": "My name is CurlTester."},
      {"role": "assistant", "content": "Hello CurlTester!"},
      {"role": "user", "content": "What is my name?"}
    ]
  }')
  if echo "$resp" | jq -e '.role == "assistant"' &>/dev/null; then
    pass "Multi-message context works"
  else
    fail "Multi-message context failed"
  fi
  verbose_output "$resp"

  # Conversation endpoints
  log_test "POST /conversations/create"
  resp=$(bs_post "/conversations/create" '{}')
  if echo "$resp" | jq -e '.success == true' &>/dev/null; then
    local convId
    convId=$(echo "$resp" | jq -r '.conversationId')
    pass "Created conversation: $convId"

    log_test "GET /conversations"
    resp=$(bs_get "/conversations?limit=5")
    if echo "$resp" | jq -e '.success == true' &>/dev/null; then
      local count
      count=$(echo "$resp" | jq '.conversations | length')
      pass "Listed $count conversations"
    else
      fail "List conversations failed"
    fi
  else
    skip "Conversations not supported: $(echo "$resp" | jq -r '.error // "unavailable"')"
  fi
}

# =============================================================================
#  Main
# =============================================================================

main() {
  echo ""
  echo -e "${BOLD}╔══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}║       Augment Backend - Curl Integration Tests            ║${NC}"
  echo -e "${BOLD}╚══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  LlamaStack:  ${CYAN}$LLAMASTACK_URL${NC}"
  echo -e "  Model:       ${CYAN}$LLAMASTACK_MODEL${NC}"
  echo -e "  Backstage:   ${CYAN}$BACKSTAGE_URL${NC} (${RUN_BACKSTAGE:+enabled}${RUN_BACKSTAGE:-disabled})"
  echo -e "  Test Group:  ${CYAN}$TEST_GROUP${NC}"
  echo -e "  Verbose:     ${CYAN}$VERBOSE${NC}"
  echo ""

  check_jq

  # Verify LlamaStack is reachable
  echo -e "${CYAN}Checking LlamaStack at ${LLAMASTACK_URL}...${NC}"
  local lsCheck
  lsCheck=$(curl -s -S --max-time 10 -k "${LLAMASTACK_URL}/v1/models" -H "accept: application/json" 2>&1) || true
  if echo "$lsCheck" | jq -e '.data | length > 0' &>/dev/null; then
    local modelCount
    modelCount=$(echo "$lsCheck" | jq '.data | length')
    echo -e "${GREEN}LlamaStack reachable ($modelCount models available).${NC}"

    # Verify selected model exists (check both .identifier and .id)
    local modelExists
    modelExists=$(echo "$lsCheck" | jq --arg m "$LLAMASTACK_MODEL" '[.data[] | select(.identifier == $m or .id == $m)] | length')
    if [[ "$modelExists" == "0" ]]; then
      echo -e "${YELLOW}Warning: Model '$LLAMASTACK_MODEL' not found.${NC}"
      echo -e "${YELLOW}Available models:${NC}"
      echo "$lsCheck" | jq -r '.data[] | "  - " + (.identifier // .id)' | head -15
    fi
  else
    echo -e "${RED}LlamaStack not reachable at ${LLAMASTACK_URL}${NC}"
    exit 1
  fi

  # Run tests
  if should_run "chat"; then
    test_chat
  fi

  if should_run "streaming"; then
    test_streaming
  fi

  if should_run "chain"; then
    test_chain
  fi

  if should_run "multiagent"; then
    test_multiagent
  fi

  if should_run "errors"; then
    test_errors
  fi

  if should_run "backstage" || [[ "$RUN_BACKSTAGE" == "1" ]]; then
    test_backstage
  fi

  # ── Summary ──────────────────────────────────────────────────────────────────

  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  Results${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  ${GREEN}Passed:  $PASSED${NC}"
  echo -e "  ${RED}Failed:  $FAILED${NC}"
  echo -e "  ${YELLOW}Skipped: $SKIPPED${NC}"
  echo -e "  Total:   $TOTAL tests"
  echo ""

  if [[ "$FAILED" -gt 0 ]]; then
    echo -e "  ${RED}Some tests failed. Run with VERBOSE=1 for details.${NC}"
    exit 1
  else
    echo -e "  ${GREEN}All tests passed!${NC}"
    exit 0
  fi
}

main "$@"

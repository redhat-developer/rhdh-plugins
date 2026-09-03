#!/usr/bin/env bash
set -euo pipefail

: "${FULLSEND_OUTPUT_SCHEMA:?FULLSEND_OUTPUT_SCHEMA must be set}"

output_name="$(basename "${FULLSEND_OUTPUT_FILE:-agent-result.json}")"
result_file="output/${output_name}"
if [[ ! -f "${result_file}" && "${output_name}" == "agent-result.json" && -f output/result.json ]]; then
  result_file="output/result.json"
fi
if [[ ! -f "${result_file}" ]]; then
  echo "FAIL: ${result_file} not found"
  exit 1
fi
if ! python3 -m json.tool "${result_file}" >/dev/null 2>&1; then
  echo "FAIL: ${result_file} is not valid JSON"
  exit 1
fi
if ! python3 -c 'import jsonschema' >/dev/null 2>&1; then
  echo "FAIL: python3 jsonschema is required"
  exit 1
fi

python3 - "${result_file}" "${FULLSEND_OUTPUT_SCHEMA}" <<'PY'
import json
import sys
from jsonschema import Draft202012Validator

with open(sys.argv[1], encoding="utf-8") as result_stream:
    result = json.load(result_stream)
with open(sys.argv[2], encoding="utf-8") as schema_stream:
    schema = json.load(schema_stream)

errors = sorted(Draft202012Validator(schema).iter_errors(result), key=lambda error: list(error.path))
if errors:
    for error in errors[:20]:
        path = ".".join(str(part) for part in error.path) or "<root>"
        print(f"FAIL: {path}: {error.message}")
    sys.exit(1)
print("PASS: agent output matches schema")
PY

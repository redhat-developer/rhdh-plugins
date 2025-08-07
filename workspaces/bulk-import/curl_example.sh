#!/bin/bash

# Example curl command to call the /execute-template endpoint
# Replace <YOUR_BACKSTAGE_TOKEN> with a valid Backstage token

# "https://github.com/AndrienkoAleksandr/shellImages"

taskId=$(curl -X POST http://localhost:7007/api/bulk-import/execute-template \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${token}" \
-d '{
  "repositories": [
    "github.com?repo=shellImages&owner=AndrienkoAleksandr"
  ],
  "templateParameters": {
    "owner": "user:default/andrienkoaleksandr"
  }
}' | jq -r '.taskIds[0]')

echo "Task id is ${taskId}"

curl -N \
  -X GET "http://localhost:7007/api/scaffolder/v2/tasks/${taskId}/eventstream" \
  -H "Accept: text/event-stream" \
  -H "Authorization: Bearer ${token}" -v
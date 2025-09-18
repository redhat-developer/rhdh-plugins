#!/bin/bash

# Example curl command to call the /execute-template endpoint
# Replace <YOUR_BACKSTAGE_TOKEN> with a valid Backstage token

# "https://github.com/AndrienkoAleksandr/shellImages"

# taskId=$(curl -X POST http://localhost:7007/api/bulk-import/execute-template \
# -H "Content-Type: application/json" \
# -H "Authorization: Bearer ${token}" \
# -d '{
#   "repositories": [
#     "https://github.com/AndrienkoAleksandr/shellImages"
#   ],
#   "templateParameters": {
#     "name": "test",
#     "repoUrl": "github.com?repo=shellImages&owner=AndrienkoAleksandr"
#   }
# }' | jq -r '.taskIds[0]')

# echo "Task id is ${taskId}"

# curl -N \
#   -X GET "http://localhost:7007/api/scaffolder/v2/tasks/${taskId}/eventstream" \
#   -H "Accept: text/event-stream" \
#   -H "Authorization: Bearer ${token}" -v


# echo "Get all repositories from DB"
# curl -X GET http://localhost:7007/api/bulk-import/repositories/from-db \
# -H "Content-Type: application/json" \
# -H "Authorization: Bearer ${token}"

# echo "Get repository from DB by name"
# curl -X GET "http://localhost:7007/api/bulk-import/repositories/db?repositoryName=https://github.com/AndrienkoAleksandr/shellImages" \
# -H "Content-Type: application/json" \
# -H "Authorization: Bearer ${token}"



##########################
# Create repository with catalog info
# Template examples/template/create-repo-with-catalog-info.yaml
##########################

projectName=test-011

taskId=$(curl -X POST http://localhost:7007/api/bulk-import/execute-template \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${token}" \
-d '{
  "repositories": [
    "https://github.com/AndrienkoAleksandr/'"${projectName}"'"
  ],
  "templateParameters": {  }
}' -v)
#  | jq -r '.taskIds[0]'
# echo "Task id is ${taskId}"

# curl -N \
#   -X GET "http://localhost:7007/api/scaffolder/v2/tasks/${taskId}/eventstream" \
#   -H "Accept: text/event-stream" \
#   -H "Authorization: Bearer ${token}" -v

# echo "Get all repositories from DB"
curl -X GET http://localhost:7007/api/bulk-import/repositories/from-db \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${token}"

# echo "Get repository from DB by name"
curl -X GET "http://localhost:7007/api/bulk-import/repositories/db?repositoryName=https://github.com/AndrienkoAleksandr/${projectName}" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${token}"



####### status


curl -N \
  -X GET "http://localhost:7007/api/scaffolder/v2/tasks/bb624cb5-64fb-41a7-be8f-c17e60d24a12" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${token}" -v




curl -X GET "http://localhost:7007/api/bulk-import/import/by-repo?repo=https://github.com/AndrienkoAleksandr/org-1-test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${token}"


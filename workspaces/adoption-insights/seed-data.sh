#!/bin/bash
# Seed mock template events into the adoption-insights backend

BACKEND_URL="http://localhost:7007/api/adoption-insights/events"
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TOKEN="Bearer eyJ0eXAiOiJ2bmQuYmFja3N0YWdlLnVzZXIiLCJhbGciOiJFUzI1NiIsImtpZCl6IjljMTcyNGM5LThiZTAtNGFiMi1iOGU4LTE2NmRiN2RiNmVjNyJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcwMDcvYXBpL2FIdGgiLCJzdWIiOiJ1c2VyOmRldmVsb3BtZW50L2d1ZXN0IiwibmJmIjoxNzUxODIwODQ4LCJleHAiOjE3NTI0MjU2NDgsImlhdCI6MTc1MTgyMDg0OH0.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcwMDcvYXBpL2F1dGgiLCJzdWIiOiJ1c2VyOmRldmVsb3BtZW50L2d1ZXN0IiwibmJmIjoxNzUxODIwODQ4LCJleHAiOjE3NTI0MjU2NDgsImlhdCI6MTc1MTgyMDg0OH0.XN0lIwiZW50ljpblnVzZXl6ZGV2ZWxvcG1lbnQvZ3Vlc3QiXSwlYXVkjoiYmFja3N0YWdlIiwiaWF0IjoxNzgzMzYxNjQ2LCJleHAiOjE3NTI0MjU2NDgsImlhdCI6MTc1MTgyMDg0OH0.1UQXQ5WjZpM3FDSWJVMVFNN2V0TUVJWGR5THpjWi9nIn0.M206o3Qc3jqh1nD7hEhne-hzRH1UseTdPSJ1DZfMO1l0K_t1Rwkdz9Kqj0mBAptalpCrpgUZsy7GHNE3ODVKew"

# example-nodejs-template: 10 clicks (has rhdh.redhat.com/time-saved: '180')
for i in $(seq 1 10); do
curl -s -X POST "$BACKEND_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d "[{
    \"action\": \"click\",
    \"subject\": \"Create\",
    \"context\": {
      \"routeRef\": \"scaffolder\",
      \"pluginId\": \"scaffolder\",
      \"extension\": \"ScaffolderPage\",
      \"entityRef\": \"template:default/example-nodejs-template\",
      \"userName\": \"user:development/guest\",
      \"userId\": \"abc123\",
      \"timestamp\": \"$DATE\"
    }
  }]"
done

echo ""
echo "Seeded: example-nodejs-template (10x, annotation: 180 min)"
echo "Expected Est. Time Saved: 30hrs (180 min × 10)"
echo "Now refresh http://localhost:3000/adoption-insights"

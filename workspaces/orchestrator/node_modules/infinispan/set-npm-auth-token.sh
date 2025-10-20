#!/bin/bash
cat << EOF > .npmrc
//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN
EOF

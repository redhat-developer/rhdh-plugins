#!/usr/bin/env bash

# Stop if any errors found
set -e

VERSION=$1
API_URL=infinispan@filemgmt.jboss.org:/docs_htdocs/infinispan/hotrod-clients/javascript

echo "Release $VERSION"
npm install npm-release
npm-release $VERSION

echo "Generate JS API docs and upload"
./node_modules/.bin/jsdoc lib/*.js
mv out apidocs
mkdir 1.0
mv apidocs 1.0
rsync -rv --protocol=28 1.0 $API_URL
mv 1.0 out

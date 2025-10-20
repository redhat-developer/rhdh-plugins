#!/usr/bin/env bash

rm -drf tmp-tests.log

node \
  --trace-deprecation \
  node_modules/jasmine-node/lib/jasmine-node/cli.js \
  spec/codec_spec.js \
  spec/functional_spec.js \
  spec/infinispan_auth_spec.js \
  spec/infinispan_cluster_spec.js \
  spec/infinispan_expiry_spec.js \
  spec/infinispan_json_spec.js \
  spec/infinispan_local_spec.js \
  spec/infinispan_ssl_spec.js \
  spec/infinispan_stress_spec.js \
  spec/protocols_spec.js \
  spec/protostream_spec.js \
  spec/tests.js \
  spec/utils_spec.js \
  --captureExceptions --junitreport --forceexit

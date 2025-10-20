#!/usr/bin/env node

"use strict";

var pgmArgs = require('../lib/json2yaml/cli');

require('../lib').json2yaml(pgmArgs, function(exitCode) {
    process.exit(exitCode);
});

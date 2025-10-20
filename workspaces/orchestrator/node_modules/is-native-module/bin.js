#!/usr/bin/env node
'use strict'

const isNative = require('.')
const pkg = require(process.cwd() + '/package.json')
process.exit(Number(!isNative(pkg)))

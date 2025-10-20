'use strict'

const isNative = pkg =>
  pkg.dependencies && (
    pkg.dependencies.bindings ||
    pkg.dependencies.prebuild ||
    pkg.dependencies.nan ||
    pkg.dependencies['node-pre-gyp'] ||
    pkg.dependencies['node-gyp-build']
  ) ||
  pkg.gypfile ||
  pkg.binary

module.exports = isNative

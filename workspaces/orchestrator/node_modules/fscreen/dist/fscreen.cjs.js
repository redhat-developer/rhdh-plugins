'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./fscreen.cjs.production.js');
} else {
  module.exports = require('./fscreen.cjs.development.js');
}

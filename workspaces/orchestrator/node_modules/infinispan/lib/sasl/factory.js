(function(root, factory) {
    if (typeof exports === 'object') {
      // CommonJS
      factory(exports, module);
    } else if (typeof define === 'function' && define.amd) {
      // AMD
      define(['exports', 'module'], factory);
    }
  }(this, function(exports, module) {
    
    /**
     * `Factory` constructor.
     *
     * @api public
     */
    function Factory() {
      this._mechs = [];
    }
    
    /**
     * Utilize the given `mech` with optional `name`, overridding the mechanism's
     * default name.
     *
     * Examples:
     *
     *     factory.use(FooMechanism);
     *
     *     factory.use('XFOO', FooMechanism);
     *
     * @param {String|Mechanism} name
     * @param {Mechanism} mech
     * @return {Factory} for chaining
     * @api public
     */
    Factory.prototype.use = function(name, mech) {
      if (!mech) {
        mech = name;
        name = mech.prototype.name;
      }
      this._mechs.push({ name: name, mech: mech });
      return this;
    };
    
    /**
     * Create a new mechanism from supported list of `mechs`.
     *
     * If no mechanisms are supported, returns `null`.
     *
     * Examples:
     *
     *     var mech = factory.create(['FOO', 'BAR']);
     *
     * @param {Array} mechs
     * @return {Mechanism}
     * @api public
     */
    Factory.prototype.create = function(mechs) {
      for (var i = 0, len = this._mechs.length; i < len; i++) {
        for (var j = 0, jlen = mechs.length; j < jlen; j++) {
          var entry = this._mechs[i];
          if (entry.name == mechs[j]) {
            return new entry.mech();
          }
        }
      }
      return null;
    };
  
    exports = module.exports = Factory;
    
  }));
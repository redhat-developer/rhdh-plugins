'use strict';

function isArray(x) {
  return Array.isArray(x) || ArrayBuffer.isView(x) && !(x instanceof DataView);
}

function Summary(data, sorted) {
  if (!(this instanceof Summary)) return new Summary(data, sorted);

  if (!isArray(data)) {
    throw TypeError('data must be an array');
  }

  this._data = data;
  this._sorted = sorted ? data : null;
  this._length = data.length;

  this._cache_sum = null;
  this._cache_mode = null;
  this._cache_mean = null;
  this._cache_quartiles = {};
  this._cache_variance = null;
  this._cache_sd = null;
  this._cache_max = null;
  this._cache_min = null;
}
module.exports = Summary;

//
// Not all values are in lazy calculated since that wouldn't do any good
//
Summary.prototype.data = function() {
  return this._data;
};

Summary.prototype.sort = function() {
  if (this._sorted === null) {
    this._sorted = this._data.slice(0).sort(function (a, b) { return a - b; });
  }

  return this._sorted;
};

Summary.prototype.size = function () {
  return this._length;
};

//
// Always lazy calculated functions
//
Summary.prototype.sum = function () {
  if (this._cache_sum === null) {
    // Numerically stable sum
    // https://en.m.wikipedia.org/wiki/Pairwise_summation
    const partials = [];
    for (let i = 0; i < this._length; i++) {
      partials.push(this._data[i]);
      for (let j = i; j % 2 == 1; j = j >> 1) {
        const p = partials.pop();
        const q = partials.pop();
        partials.push(p + q);
      }
    }

    let total = 0.0;
    for (let i = 0; i < partials.length; i++) {
      total += partials[i];
    }
    this._cache_sum = total;
  }
  return this._cache_sum;
};

Summary.prototype.mode = function () {
  if (this._cache_mode === null) {
    const data = this.sort();

    let modeValue = NaN;
    let modeCount = 0;
    let currValue = data[0];
    let currCount = 1;

    // Count the amount of repeat and update mode variables
    for (let i = 1; i < this._length; i++) {
      if (data[i] === currValue) {
        currCount += 1;
      } else {
        if (currCount >= modeCount) {
          modeCount = currCount;
          modeValue = currValue;
        }

        currValue = data[i];
        currCount = 1;
      }
    }

    // Check the last count
    if (currCount >= modeCount) {
      modeCount = currCount;
      modeValue = currValue;
    }

    this._cache_mode = modeValue;
  }

  return this._cache_mode;
};

Summary.prototype.mean = function () {
  if (this._cache_mean === null) {
    // Numerically stable mean algorithm
    let mean = 0;
    for (let i = 0; i < this._length; i++) {
        mean += (this._data[i] - mean) / (i+1);
    }
    this._cache_mean = mean;
  }

  return this._cache_mean;
};

Summary.prototype.quartile = function (prob) {
  if (!this._cache_quartiles.hasOwnProperty(prob)) {
    const data = this.sort();
    const product = prob * this.size();
    const ceil = Math.ceil(product);

    if (ceil === product) {
      if (ceil === 0) {
        this._cache_quartiles[prob] = data[0];
      } else if (ceil === data.length) {
        this._cache_quartiles[prob] = data[data.length - 1];
      } else {
        this._cache_quartiles[prob] = (data[ceil - 1] + data[ceil]) / 2;
      }
    } else {
      this._cache_quartiles[prob] = data[ceil - 1];
    }
  }

  return this._cache_quartiles[prob];
};

Summary.prototype.median = function () {
  return this.quartile(0.5);
};

Summary.prototype.variance = function () {
  if (this._cache_variance === null) {
    // Numerically stable variance algorithm
    const mean = this.mean();
    let biasedVariance = 0;
    for (let i = 0; i < this._length; i++) {
      const diff = this._data[i] - mean;
      biasedVariance += (diff * diff - biasedVariance) / (i+1);
    }

    // Debias the variance
    const debiasTerm = ((this._length) / (this._length - 1));
    this._cache_variance = biasedVariance * debiasTerm;
  }

  return this._cache_variance;
};

Summary.prototype.sd = function () {
  if (this._cache_sd === null) {
    this._cache_sd = Math.sqrt(this.variance());
  }

  return this._cache_sd;
};

Summary.prototype.max = function () {
  if (this._cache_max === null) {
    this._cache_max = this.sort()[this._length - 1];
  }

  return this._cache_max;
};

Summary.prototype.min = function () {
  if (this._cache_min === null) {
    this._cache_min = this.sort()[0];
  }

  return this._cache_min;
};

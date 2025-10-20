# summary

> Takes an array of numbers and calculates some descriptive statistics

## Installation

```sheel
npm install summary
```

## Example

```javascript
var summary = require('summary');

var data = summary([-1, 0, 1], true /* sorted */);
console.log(data.variance()); // 1
console.log(data.mean()); // 0
```

## Documentation

The `summary` constructor, takes a required `data` array and and optional
boolean indication whether or not the `data` is `sorted` from small to big,
by default `sorted` is `false`.

```javascript
// Data is sorted from small to big
var data = summary([-1, 0, 1], true);

// Data is sorted, but summary dosn't know. Works fine just a bit slower.
var data = summary([-1, 0, 1] /*, default false */);

// Data is sorted in reverse order
var data = summary([1, 0, -1] /*, default false */);

// Data isn't sorted
var data = summary([0, 1, -1] /*, default false */);
```

The data object has the following metods, note that almost all values is lazy
calculated and then cached.

```javascript
data.data(); // Returns the original array

data.sort(); // Returns the sorted array

data.size(); // Returns the data length

data.sum(); // Returns the data sum

data.mode(); // Returns mode

data.mean(); // Returns the mean

data.quartile(0.25); // Returns 25% quartile

data.median(); // Returns the median

data.variance(); // Returns the variance

data.sd(); // Returns the standard deviation

data.max(); // Returns the maximum value
data.min(); // Returns the minimum value
```

## License

**The software is license under "MIT"**

> Copyright (c) 2013 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.

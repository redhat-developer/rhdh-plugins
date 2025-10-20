# select-case
A better switch case

## Installation

```sh
npm install select-case --save
```

## Usage

```js
import { select } from "select-case";
let fruit = 'apple'

let color = select(fruit, {
    // can be values
    banana: 'yellow',
    // or functions
    apple: () => Math.random() > 0.5 ? 'red' : 'green',
    // default case
    default: 'red'
})
```

## Other libs

Most other libs curried or put the cases first and the selector second.
I put the selector up front and the cases afterward to try and preserve the switch/case look & feel.

## Dependencies

None

## Dev Dependencies

None

## License

MIT

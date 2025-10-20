# @isomorphic-git/pgp-plugin
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fisomorphic-git%2Fpgp-plugin.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fisomorphic-git%2Fpgp-plugin?ref=badge_shield)


[`isomorphic-pgp`](https://github.com/wmhilton/isomorphic-pgp) plugin for [a future version of] isomorphic-git

Note: no version of isomorphic-git has been released that uses this plugin yet.

It's a chicken and egg problem. Gotta write the plugin first, then modify isomorphic-git to use it.

## Usage

```js
// Node
const { pgp } = require('@isomorphic-git/pgp-plugin')
const git = require('isomorphic-git')

git.plugins.set('pgp', pgp)

// Now you can use git.sign() and git.verify()
```

In contrast with the full-featured [OpenPGP.js plugin](https://github.com/isomorphic-git/openpgp-plugin), this uses `isomorphic-pgp` which is a lightweight, MIT-licensed library.
Right now it is limited to using RSA keys and signatures made using the SHA1 hashing algorithm.

## Tests

```sh
npm test
```

## License

MIT

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fisomorphic-git%2Fpgp-plugin.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fisomorphic-git%2Fpgp-plugin?ref=badge_large)
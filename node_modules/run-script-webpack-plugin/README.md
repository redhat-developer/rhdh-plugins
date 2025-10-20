# run-script-webpack-plugin

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![licenses][licenses]][licenses-url]
[![downloads][downloads]][downloads-url]
[![size][size]][size-url]
> Automatically run your script once Webpack's build completes.
 
NOTE: mostly copied from [this](https://github.com/ericclemmons/start-server-webpack-plugin) repo, but strongly typed from scratch

### Installation

```shell
npm i -D run-script-webpack-plugin
```

### Usage

In `webpack.config.ts`:

```js
import { RunScriptWebpackPlugin } from "run-script-webpack-plugin";

export default {
  plugins: [
    ...
    // Only use this in DEVELOPMENT
    new RunScriptWebpackPlugin({
      name: 'server.js',
      nodeArgs: ['--inspect'], // allow debugging
      args: ['scriptArgument1', 'scriptArgument2'], // pass args to script
      autoRestart: true | false, // Should the script auto-restart after emit. Defaults to true. This should be set to false if using HMR
      signal: false | true | 'SIGUSR2', // signal to send for HMR (defaults to `false`, uses 'SIGUSR2' if `true`)
      keyboard: true | false, // Allow typing 'rs' to restart the server. default: only if NODE_ENV is 'development'
      cwd: undefined | string, // set a current working directory for the child process default: current cwd
    }),
  ],
}
```

The `name` argument in `RunScriptWebpackPluginOptions` refers to the built asset, which is named by the output options of webpack (in the example the entry `server` becomes `server.js`. This way, the plugin knows which entry to start in case there are several.

If you don't pass a name, the plugin will tell you the available names.

You can use `nodeArgs` and `args` to pass arguments to node and your script, respectively. For example, you can use this to use the node debugger.

To use Hot Module Reloading with your server code, set Webpack to "hot" mode and include the `webpack/hot/poll` or `webpack/hot/signal` modules. Make sure they are part of your server bundle, e.g. if you are using `node-externals` put them in your whitelist. The latter module requires the `signal` option.

### License

> Refer to [LICENSE](LICENSE) file

### Contributing

* Use [conventional commmits](https://conventionalcommits.org/)
* There is a eslint config in the repo. Check if no new errors are added. (dont change the config inside ur PRs)

[npm]: https://img.shields.io/npm/v/run-script-webpack-plugin.svg
[npm-url]: https://npmjs.com/package/run-script-webpack-plugin
[node]: https://img.shields.io/node/v/run-script-webpack-plugin.svg
[node-url]: https://nodejs.org
[deps]: https://img.shields.io/david/atassis/run-script-webpack-plugin.svg
[deps-url]: https://david-dm.org/atassis/run-script-webpack-plugin
[licenses-url]: http://opensource.org/licenses/MIT
[licenses]: https://img.shields.io/npm/l/run-script-webpack-plugin.svg
[downloads-url]: https://npmcharts.com/compare/run-script-webpack-plugin?minimal=true
[downloads]: https://img.shields.io/npm/dm/run-script-webpack-plugin.svg
[size-url]: https://packagephobia.com/result?p=run-script-webpack-plugin
[size]: https://packagephobia.com/badge?p=run-script-webpack-plugin

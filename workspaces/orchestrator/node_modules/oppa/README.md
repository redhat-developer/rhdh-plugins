[![npm version][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]
[![build status][build-image]][build-url]
[![coverage status][coverage-image]][coverage-url]
[![Language grade: JavaScript][lgtm-image]][lgtm-url]


<img src="https://cdn.rawgit.com/grantila/oppa/HEAD/oppa.svg" width="100%" />

Oppa is an **op**tions **pa**rser (also known as *arguments parser*).

It is very easy to use, yet powerful, and if used from TypeScript, the parsed result will have types matching the parse configuration.

By default, oppa creates `--help` (and `-h`) arguments which it uses to produce a help output, describing the arguments. If a version is provided, it creates `--version` and `-v` too.


# Features

- Typesafe parse result **(unique feature)**
- Handles `--long` and `-short` names
    - (the second is equivalent to `-s -h -o -r -t`)
- Aliases (e.g. `--force` = `-f`)
- Auto generated `--help` (`-h`) page
- Auto generated `--version` (`-v`)
- Powerful argument value handling
    - Supports strings, booleans and numbers
    - Auto-allows `no-` prefixes (e.g. `--no-keep`) to boolean arguments
    - Multi value argument `--find foo bar --baz` (`find = [ 'foo', 'bar' ]`)
    - Typesafe validators
    - Specific values, individually documented in `--help`
- Understands *dash-dash* separation (`--`)
- Smart defaults (what appears as default in `--help` can be dynamic at run-time)
- Groups of arguments (potentially shown in different colors in `--help`)


# Usage

```ts
import { oppa } from 'oppa'

const result =
    oppa( {
        name: 'myapp',
        version: '1.2.3',
    } )
    .add( {
        name: 'file',
        alias: 'f',
        type: 'string',
        description: 'The file to write to',
    } )
    .add( {
        name: 'retry',
        alias: 'r',
        type: 'number',
        description: 'Retry <retry> times before bailing',
    } )
    .add( {
        name: 'force',
        type: 'boolean',
        default: true,
        description: 'Force writing to the file',
    } )
    // Defaults to process.argv if no array is provided:
    .parse( [ '-f', 'test.json', '--no-force', 'foo' ] );

expectDeepEqual( result, {
    args: {
        file: 'test.json',
        force: false,
    },
    unknown: [ ],
    rest: [ 'foo' ],
    dashdash: [ ],
} );

// If using TypeScript, the following will not compile since
// <force> is a boolean (even at compile-time):
result.args.force.toLowerCase( ); // !
```

`--help` will write:

```
   Usage: myapp [options]

   Options:

      -h, --help            Print (this) help screen
      -v, --version         Print the program version
      -f, --file <file>     The file to write to
      -r, --retry <retry>   Retry <retry> times before bailing
      --(no-)force          Force writing to the file (default: true)
```


# API

## Settings

The `oppa( )` function creates an object on which arguments can be configured. It can then be used to parse an array of strings, and also to print a help screen.

The options to the `oppa( )` function are:

```ts
{
    name: string;
    version: string;
    usage: string;
    description: Description;
    noHelp: boolean;
    noHelpAlias: boolean;
    noVersionAlias: boolean;
    allowUnknown: boolean;
    throwOnError: boolean;
    noExit: boolean;
}
```

`name`, `version`, `usage` and `description` are used for the auto-generated `--help` and `--version` options.

If `noHelp` is true, a `--help` will not be auto-generated.

`noHelpAlias` and `noVersionAlias` will prevent the auto-generated `--version` and `--help` to have shortcut aliases `-v` and `-h`, so they can be used for other options, e.g. `verbose` and `host`.

`allowUnknown` will cause oppa not to fail on unknown arguments, but simply keep them as booleans or strings (in its own array of `{ name, value }` objects called `unknown`). `--foo` will add a boolean `foo` and set it to `true`. `--bar=baz` will set the name `bar` to the string `baz`.

`throwOnError` will, instead of printing a help screen on invalid arguments, throw an error so that you can control the flow (sometimes useful in unit tests).

`noExit` causes the program not to exit after having printed the help screen or version (sometimes useful in unit tests).


## Arguments

The result of `oppa( )` is an object on which you can add arguments using `add` which takes the following options:

```ts
    oppa( )
    .add( {
        // These are required:
        name: 'force',   // The long-versioned name
        type: 'boolean', // 'string', 'boolean' or 'number'

        // These are optional
        alias: 'f',        // An alias (or array of aliases)
        multi: false,      // Whether this is a multi-valued argument,
                           // only applicable to 'string' and 'number'.
        description: [     // A string or array of strings
            'Force action',
            'Will overwrite foo if bar'
        ],
        negatable: false,  // Adds 'no-' alternative (only applicable
                           // to boolean and true by default)
    } )
    .add( {
        name: 'file',
        type: 'string',

        // More optional, mostly for 'string' and 'number' arguments
        default: 'out.json', // The default-value (printed to --help)
        realDefault:         // The run-time default, unless <default>
            path.join( __dirname, 'out.json' ),
        values: [            // A list of valid values, other will
                             // fail. Will be printed to --help too.
            { 'file': 'Filename of the file to write to' },
            { '-': 'Write to stdout' }
        ],
        example: [           // A list of example arguments
            { '-f my-file.json': 'Write to my-file.json' },
            { '-f -': 'Write to stdout' },
        ],
        match: ( file ) =>   // Custom validation. Overwrites <values>
            file === '-' || file.endsWith( '.json' ),
    } )
```

These will cause the following `--help` output:

```
   Usage: [options]

   Options:

      -h, --help      Print (this) help screen
      -f, --force     Force action
                      Will overwrite foo if bar
      --file <file>    (default: out.json)

                      Values:
                         file   Filename of the file to write to
                         -      Write to stdout

                      Example:
                         -f my-file.json   Write to my-file.json
                         -f -              Write to stdout
```


## Groups

Arguments can be grouped, and have the group name printed above the group arguments in `--help`. They can also be in a separate color (background and/or foreground):

```ts
    oppa( )
    .add( { name: 'force' } ) // Generic ungrouped

    .group( { name: "Inputs", color: 'black', backgroundColor: '#8ff' } )
    .add( { name: 'allow-bad' } )
    .add( { name: 'filter-deprecated' } )

    .group( { name: "Viewing", color: '#fff', backgroundColor: 'blue' } )
    .add( { name: 'view-all' } )
    .add( { name: 'defailed' } );
```


# Sub-commands

For sub-commands (e.g. like `git`), oppa is designed not to support this as a single-step parsing solution. Instead, you're encouraged to run oppa again. Oppa saves no global state, everything is local to an `oppa( )` context.

```ts
    const mainResult =
        oppa( )
        .add( /* ... */ )
        .add( /* ... */ )
        .parse( ); // Will parse process.argv

    // Applies to the entire application, e.g. verbosity, debug
    const globalOptions = mainResult.args;
    const [ subCommand, ...subArgs ] = mainResult.rest;

    switch ( subCommand ) // The first non-option argument
    {
        case 'init': return runInit( subArgs );
        case 'push': return runPush( subArgs );
    }

    // ...

    function runInit( args )
    {
        // Parse <init> arguments:
        const initOptions = oppa( )
            .add( /* ... */ )
            .add( /* ... */ )
            .parse( args );

        // ...
    }

    function runPush( args )
    {
        // ...
    }
```


[npm-image]: https://img.shields.io/npm/v/oppa.svg
[npm-url]: https://npmjs.org/package/oppa
[downloads-image]: https://img.shields.io/npm/dm/oppa.svg
[build-image]: https://img.shields.io/github/workflow/status/grantila/oppa/Master.svg
[build-url]: https://github.com/grantila/oppa/actions?query=workflow%3AMaster
[coverage-image]: https://coveralls.io/repos/github/grantila/oppa/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/grantila/oppa?branch=master
[lgtm-image]: https://img.shields.io/lgtm/grade/javascript/g/grantila/oppa.svg?logo=lgtm&logoWidth=18
[lgtm-url]: https://lgtm.com/projects/g/grantila/oppa/context:javascript

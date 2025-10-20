# github-codeowners
[![Maintainability](https://api.codeclimate.com/v1/badges/005e2a8038aa060010dd/maintainability)](https://codeclimate.com/github/jjmschofield/github-codeowners/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/005e2a8038aa060010dd/test_coverage)](https://codeclimate.com/github/jjmschofield/github-codeowners/test_coverage)
[![CircleCI](https://circleci.com/gh/jjmschofield/github-codeowners/tree/master.svg?style=shield)](https://circleci.com/gh/jjmschofield/github-codeowners/tree/master)
[![Known Vulnerabilities](https://snyk.io/test/github/jjmschofield/github-codeowners/badge.svg?targetFile=package.json)](https://snyk.io/test/github/jjmschofield/github-codeowners?targetFile=package.json)

A CLI tool for working with GitHub CODEOWNERS.

Things it does:
* Calculate ownership stats
* Find out who owns each and every file (ignoring files listed in `.gitignore`)
* Find out who owns a single file
* Find out who owns your staged files
* Outputs in a bunch of script friendly handy formats for integrations (CSV and JSONL)
* Validates that your CODEOWNERS file is valid

## Installation
Install via npm globally then run

```shell script
$ npm i -g github-codeowners
$ github-codeowners --help 
Usage: github-codeowners [options] [command]
```

## Commands
### Audit
Compares every file in your current (or specified) directory against your CODEOWNERS rules and outputs the result of who owns each file.
```shell script
$ cd <your awesome project> 
$ github-codeowners audit
README.md
package.json
src/cli.ts      @jjmschofield
...
```

Ownership stats:
```shell script
$ github-codeowners audit -s
--- Counts ---
Total: 24 files (1378 lines) 100%
Loved: 10 files (494 lines) 41.6%
Unloved: 14 files (884 lines) 58.4%
--- Owners ---
@jjmschofield: 10 files (494 lines) 41.6%
```

Only files in a specific directory:
```shell script
$ github-codeowners audit -r src/
src/cli.ts      @jjmschofield
src/commands/audit.ts   @jjmschofield
...
```

Only unowned files:
```shell script
$ github-codeowners audit -u
.github/CODEOWNERS
.gitignore
```

Output in JSONL:
```shell script
$ github-codeowners audit -o jsonl
{"path":"src/commands/audit.ts","owners":["@jjmschofield"],"lines":48}
...
```

Output in CSV:
```shell script
$ github-codeowners audit -o csv
src/commands/audit.ts,@jjmschofield
```

Full usage information:
```shell script
$ github-codeowners audit --help
Usage: github-codeowners audit [options]

list the owners for all files

Options:
  -d, --dir <dirPath>          path to VCS directory (default: "<current working directory>")
  -c, --codeowners <filePath>  path to codeowners file (default: "<dir>/.github/CODEOWNERS")
  -o, --output <outputFormat>  how to output format eg: simple, jsonl, csv (default: "simple")
  -u, --unloved                unowned files only (default: false)
  -g, --only-git               consider only files tracked by git (default: false)
  -s, --stats                  output stats (default: true)
  -r, --root <rootPath>        the root path to filter files by (default: "")
  -h, --help                   output usage information
```

### Who
Tells you who owns a given file or files: 
```shell script
$ cd <your awesome project> 
$ github-codeowners who <file> <file>
<file> @some/team
<file> @some/team
```

Full usage:
```shell script
$ github-codeowners who --help                   
Usage: github-codeowners who [options] <file...>

lists owners of a specific file or files

Options:
  -d, --dir <dirPath>          path to VCS directory (default: "/Users/jjmschofield/projects/github/snyk/registry")
  -c, --codeowners <filePath>  path to codeowners file (default: "<dir>/.github/CODEOWNERS")
  -o, --output <outputFormat>  how to output format eg: simple, jsonl, csv (default: "simple")
  -h, --help                   output usage information
```

### Git
Provides a list of files with their owners between commits (against the **current** version of CODEOWNERS).

Ownership of all files staged for commit:
```shell script
$ cd <your awesome project>
$ github-codeowners git
```

Ownership of files existing at a specific commit:
```shell script
$ github-codeowners git <commit sha>
```

Ownership of files changed between two commits:
```shell script
$ github-codeowners git <commit sha> <commit sha>
```

Output stats:
```shell script
$ github-codeowners git -s
```

Full usage:
```shell script
$ github-codeowners git --help                                                                                       
Usage: github-codeowners git [options] [shaA] [shaB]

lists owners of files changed between commits, a commit against head or staged against head.

Options:
  -d, --dir <dirPath>          path to VCS directory (default: "/Users/jjmschofield/projects/github/snyk/registry")
  -c, --codeowners <filePath>  path to codeowners file (default: "<dir>/.github/CODEOWNERS")
  -o, --output <outputFormat>  how to output format eg: simple, jsonl, csv (default: "simple")
  -s, --stats                  output stats, note line counts are not available for this command (default: false)
  -h, --help                   output usage information
```

### Validate
Validates your CODEOWNERS file to find common mistakes, will throw on errors (such as malformed owners).
```shell script
$ cd <your awesome project> 
$ github-codeowners validate
Found duplicate rules [ 'some/duplicate/rule @octocat' ]
Found rules which did not match any files [ 'some/non-existent/path @octocat' ]
...
```

Full usage information:
```shell script
$ github-codeowners validate --help
Usage: github-codeowners validate [options]

Validates a CODOWNER file and files in dir

Options:
  -d, --dir <dirPath>          path to VCS directory (default: "<current working directory>")
  -c, --codeowners <filePath>  path to codeowners file (default: "<dir>/.github/CODEOWNERS")
  -r, --root <rootPath>        the root path to filter files by (default: "")
  -h, --help                   output usage information
```

## Output Formats
Check `github-codeowners <command> --help` for support for a given command, however generally the following outputs are supported:
* `simple` - tab delimited - terminal friendly output
* `jsonl` - line separated json - useful for streaming data to another command
* `csv` - csv delimited fields - useful to import into a spreadsheet tool of your choice

## Limits and Things to Improve
* It requires node
* It is not optimized
* The output interface might change
* Command syntax might change

## Shout outs
Inspired by [codeowners](https://github.com/beaugunderson/codeowners#readme) but implemented in Typescript with extra bells and whistles.

This project is a fork of [jjmschofield's version](https://github.com/jjmschofield/github-codeowners).

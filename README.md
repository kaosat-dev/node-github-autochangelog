# Automatically generate changelogs using the GitHub API, for Node.JS

changelog auto generation based on github issues + git version tag deltas

## Installation

  Install with the Node.JS package manager [npm](http://npmjs.org/):

      $ npm install -g github-autoChangelog

or

  Install via git clone:

      $ git clone git@github.com:kaosat-dev/node-github-autoChangelog.git
      $ cd node-github-autoChangelog
      $ npm install -g

## Example

command line usage :

    ghAutoChangeLog --repo https://github.com/kaosat-dev/DummyRepo --out mychangeLog.md -v 2

output :

DummyRepo: v0.1.0
=================
   - Done: issue 1

DummyRepo: v0.2.0
=================
   - Done: issue 1
   - Fixed: issue 2
   - Done: issue 3

DummyRepo: v0.3.0
=================
   - Done: issue 3
   - Done: issue 5

## Notes

- favor using commits to close github issues
- tag correctly after closing issues


## Licence

MIT

ghchangelog
	--repo : repo name/path ie either <userName>/<repoName> or https://github.com/<userName>/<repoName>
	--out : path to output file
	- v verbosity 

ghchangelog will also prompt your for your github login & password (not stored, obscured password), as Github Api severly limits the number of 
requests without autorization.


command line usage :

    ghchangelog --repo https://github.com/kaosat-dev/DummyRepo --out mychangeLog.md -v 2

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


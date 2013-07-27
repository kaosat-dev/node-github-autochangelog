#!/usr/bin/env node

var argv = require('optimist')
    .usage('Usage: $0 --repo --out -v')
	.default({ out : "changelog.md", v:1})
    .demand(['repo'])
    .argv;

var GitHubApi = require("github");
var Q = require("q");
var url = require("url");
var prompt = require('prompt');

if( argv.repo.indexOf("/") == -1)
{
	console.log("full repo name needed : ie either <userName>/<repoName> or https://github.com/<userName>/<repoName>");
	return;
}

var fullRepoName = url.parse(argv.repo).path;
fullRepoName = fullRepoName.charAt(0) == '/' ? fullRepoName.slice(1) : fullRepoName;
fullRepoName = fullRepoName.split("/")

var userName = fullRepoName[0];
var repoName = fullRepoName[1];
var outputFileName = argv.out;
var verbosity = argv.v;
var login = null;
var password = null;

var github = new GitHubApi({version: "3.0.0",timeout: 10000 });


/*----------------------------RUN----------------*/
//Running it !
init().then(getTags).then(getIssuesInTimeFrame).then(generateChangeLog).fail(handleError);

/*----------------------------PROCESS/ALGO----------------*/
/* for each TAG (starting from +1)
	get date of previous TAG
	get date of current TAG 
	add Title /version of current tag
	getIssuesFromDateToDate
*/

/*----------------------------STEPS----------------*/

function init()
{
	var initDeferred = Q.defer();
	
	console.log("===Please enter github login/password (needed because of rate limits on the api without authorization===");

	prompt.message = "";
  	prompt.delimiter = "-".green;

	prompt.start();
	prompt.get([{name: 'username',required: true}, {name: 'password',hidden: true,conform: function (value) {return true;}
    }], function (err, result)
	{
		if(err !== null)
		{
			initDeferred.reject(err);
			return;
		}
		github.authenticate({
		   type: "basic",
		   username: result.username,
		   password: result.password
		});
		console.log("===Generating changelog for",userName+"/"+repoName, "to", outputFileName+"===");
		initDeferred.resolve();
  	});
	return initDeferred.promise;
}

//STEP 1
function getTags()
{
	/*retrieve all tags, then get their commit dates*/
	if (verbosity > 1)
	{
		console.log("   Started Fetching tags data");
	}
	var tagsDeferred = Q.defer();
	var tags = [];

	d1 =  Q.nfcall(github.repos.getTags,{user:userName, repo: repoName, per_page:100})
	d1.then(parseResults).then(function(){
	tagsDeferred.resolve(tags);
	}).fail(handleError);

	function parseResults(results)
	{
		for(var i=0;i<results.length;i++)
		{
			var tagData = results[i];	
			var sha = tagData.commit.sha;
			var name = tagData.name;
			var tag = {name:tagData.name, sha:tagData.commit.sha};
			tags.push(tag);
		}
		if (verbosity > 1)
		{
			console.log("     Found",tags.length,"tags");
		}
		var promises=[];
		tags.forEach(function(tag)
		{
		    deferred = getTagDateBla(tag);
		    promises.push(deferred.promise);
    	});
		return Q.all(promises);
	}

	function getTagDateBla(tag)
	{
		var deferred = Q.defer();
		github.gitdata.getCommit({user:userName, repo: repoName, sha:tag.sha}, function(error,commit)
		{
			if(error !== null)
			{
				console.log("error getting tag date", error);
				deferred.reject(error);
				throw(err);
				return;
			}
			var date = commit.committer.date;
			tag.date = date;
			deferred.resolve(date);
		});
		return deferred;
	}
	
	function logStepEnd()
	{
		if (verbosity > 1)
		{
			console.log("   Finished Fetching tags data");
		}
	}
	tagsDeferred.promise.then(logStepEnd);
	return tagsDeferred.promise;
}

//STEP 2
function getIssuesInTimeFrame(tags)
{
	if (verbosity > 1)
	{
		console.log("   Started getting issues in tag timeframes");
	}
	/*retrieve issues in timeframes, generally between two tags*/
	var issuesPerTimeFrameDeferred = Q.defer();
	var startDate = "2010-12-02T23:11:24Z";//"1950-01-01T00:00:00Z";
	var endDate = "";
	

	getAllIssues().then(structureInTimeFrame);

	function structureInTimeFrame(issues)
	{

		//, JSON.stringify(issues));
		tags.sort(compareTags);

		tags.forEach(function(tag)
		{
			endDate = tag.date;
			//process issues in timeframe
			addIssuesToTag(issues, startDate, endDate, tag);

			//prepare next tag
			startDate = tag.date;
		});
		issuesPerTimeFrameDeferred.resolve(tags);
	}

	function addIssuesToTag(issues, startDate, endDate, tag)
	{
		var sDate = new Date(startDate);
		var eDate = new Date(endDate);
		
		tag.items = [];
		//console.log("Tag", tag.name, "start date", sDate, "end", eDate, "total issues count", issues.length);
		for(var i=0;i<issues.length;i++)
		{
			var issue = issues[i];
			//console.log("Issue: ",issue.title, issue.closed_at);
			var closedDate = new Date(issue.closed_at);
			if (closedDate >= sDate)
			{
				//console.log("Valid");
				//console.log("Issue: ",issue.title, issue.closed_at);
				//console.log("issue", issue.number,"ok bounds");
				tag.items.push(issue);
			}
			if (closedDate >= eDate)
			{
				//console.log("issue", issue.number,"outside bounds");
				break;
			}
		}
	}

	function getAllIssues()
	{
		var deferred = Q.defer();
		github.issues.repoIssues({user:userName, repo: repoName,state:"closed",direction:"asc", sort:"updated"}, function(err,res){
			if(err !== null)
			{
				console.log("error", err);
				defered.reject(error);
				return;
			}
			
			var issues = [];
			var issueEventsPromises = [];

			for(var i=0;i<res.length;i++)
			{
				var issueData = res[i];
				//IMPORTANT : cannot use issue.closed_at : unreliable timestamp , hence double check via commit's date (if issue was closed that way)!!
				//console.log("issue", issueData.number, "original closed at", issueData.closed_at);
				var issue = {title:issueData.title,closed_at:issueData.closed_at, number:issueData.number};
				issues.push(issue);

				var subDeferred = getIssueEvents(issue);
				issueEventsPromises.push(subDeferred.promise);
			}
			Q.all(issueEventsPromises).then(function(){

				if (verbosity > 1)
				{
					console.log("     Found",issues.length,"issues");
				}

				deferred.resolve(issues)
			});
		});
		return deferred.promise;
	}

	function logStepEnd()
	{
		if (verbosity > 1)
		{
			console.log("   Finished  getting issues in tag timeframes");
		}
	}
	issuesPerTimeFrameDeferred.promise.then(logStepEnd);

	return issuesPerTimeFrameDeferred.promise;
}


//STEP3
function generateChangeLog(tags)
{
	if (verbosity > 1)
	{
		console.log("   Started generating changelog file");
	}
	var fs = require("fs");

	outputFileHandler = fs.openSync(outputFileName, 'w');
	tags.forEach(function(tag)
	{
		//console.log(formatTag(tag));
		
		fs.writeSync(outputFileHandler, formatTag(tag)+"\n")
		//console.log("tag items", tag.items.length);
		tag.items.forEach(function(item)
		{
			item = formatIssue(item);
			//console.log("   -", item.status, item.title);
			fs.writeSync(outputFileHandler, "   - "+item.status+" "+item.title+"\n")
		});
		//console.log(" ");
		fs.writeSync(outputFileHandler, "\n")
		//console.log("issue :" , issue.number, " ", issue.title, " ",issue.state, " closed at ",issue.closed_at);
	});

	if (verbosity > 1)
	{
		console.log("   Finished generating changelog file");
	}

	fs.closeSync(outputFileHandler);
}

/*----------------------------HELPERS----------------*/
function compareTags(t1, t2) 
{
	var semver = require('semver');
	var t1Version = semver.clean(t1.name);
	var t2Version = semver.clean(t2.name);
  	if (semver.lt(t1Version, t2Version))
     return -1;
  	if (semver.gt(t1Version, t2Version))
    	return 1;
  	return 0;
}



function formatIssue(issue)
{
	//clean up text
	issue.title = issue.title.replace("fixed", "").replace("Fix", "").replace("fix","").replace(/^\s*/g, "");
	issue.title = issue.title.charAt(0).toLowerCase()+ issue.title.slice(1);

	if(!("status" in issue) )
	{
		issue.status = "Done:";
	}
	//console.log("- ", issue.status,issue.title);//,"closed_at",issue.closed_at);
	return issue
}

function formatTag(tag)
{
	var tagFormated = repoName+": "+tag.name+"\n"+Array(repoName.length + tag.name.length+3).join("=")
	//console.log(repoName, ":", name, " ", sha);//JSON.stringify(res)); 
	return(tagFormated);
}


function getIssueEvents(issue)
{
	var deferred = Q.defer();

	github.issues.getEvents({user:userName, repo: repoName,number:issue.number}, function(err,res){
		if(err !== null)
		{
			console.log("error getting issue events", err);
			deferred.reject(new Error("error "+err.message+" code"+err.code));
			//throw(new Error("error "+err.message+" code"+err.code));
		}
		else
		{
			var issueEventsPromises = [];		
			for(var i=0;i<res.length;i++)
			{
				var event = res[i];
				if(event.event == "closed")
				{
					if (event.commit_id !== null)
					{
						var sha = event.commit_id;
						//console.log("close event commit_id", event.commit_id);
						var subDeferred = getCloseFixedDetails(sha, issue);
						issueEventsPromises.push(subDeferred.promise);
					}
					else
					{
						//formatIssue(issue);
					}
				}
			}
			Q.all(issueEventsPromises).then(function(){
					deferred.resolve()
			});
		}

		//deferred.resolve();
	});
	return deferred;
}

function getCloseFixedDetails(commitSha, issue)
{
	var deferred = Q.defer();

	github.gitdata.getCommit({user:userName, repo: repoName,sha:commitSha}, function(err,res){
		if(err !== null)
		{
			console.log("error getting closed and fixed details", err);
			deferred.reject(new Error("error "+err.message+" code"+err.code));
			//throw(new Error("error "+err.message+" code"+err.code));
		}
		else
		{
			var commit = res;
			var message = commit.message;
			issue.closed_at = commit.committer.date;
			//console.log("commit", message, "when:", commit.committer.date);
			//console.log("issue", issue.number, "final closed at", new Date(commit.committer.date));

			if( message.indexOf("fixes") !== -1)
			{
				issue.status = "Fixed:";
			}
			else if( message.indexOf("closes") !== -1)
			{
				issue.status = "Done:";
			}
			else
			{
				issue.status = "Done:";
			}
			issue = formatIssue(issue);
			deferred.resolve(issue);
		}
	});
	return deferred;
}

function retry(f) {
	//from https://gist.github.com/domenic/2936696

    return f().then(
        undefined, // pass through success
        function (err)
		{
            if (err instanceof TemporaryNetworkError) 
			{
                return retry(f); // recurse
            }
            throw err; // rethrow
        }
    );
}

function TemporaryNetworkError() {
    Error.apply(this, arguments);
}
TemporaryNetworkError.prototype = new Error();
TemporaryNetworkError.prototype.constructor = TemporaryNetworkError;
TemporaryNetworkError.prototype.name = 'TemporaryNetworkError';


function handleError(error)
{
	console.log("AutoChangeLog failed because of error:", error);
}



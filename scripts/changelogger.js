/*var argv = require('optimist')
    .usage('Usage: $0 -x [num] -y [num]')
    .demand(['x','y'])
    .argv;
*/
var GitHubApi = require("github");

var github = new GitHubApi({
   // required
   version: "3.0.0",
   // optional
   timeout: 5000
});

github.authenticate({
   type: "basic",
   username: "",
   password: ""
});


/*
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
*/

var userName = "kaosat-dev";
var repoName = "coffeescad";
var Q = require("q");

/* for each TAG (starting from +1)
	get date of previous TAG
	get date of current TAG 
	add Title /version of current tag
	getIssuesFromDateToDate
*/

//STEP 1
function getTags()
{
	/*retrieve all tags, then get their commit dates*/

	var tagsDeferred = Q.defer();
	var tags = [];

	d1 =  Q.nfcall(github.repos.getTags,{user:userName, repo: repoName, per_page:100})
	d1.then(parseResults).then(function(){
	tagsDeferred.resolve(tags);
	});

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
		github.gitdata.getCommit({user:userName, repo: repoName, sha:tag.sha}, function(err,commit)
		{
			if(err !== null)
			{
				console.log("error getting tag date", err);
				deferred.reject(error);
			}
			var date = commit.committer.date;
			tag.date = date;
			deferred.resolve(date);
		});
		return deferred;
	}
	return tagsDeferred.promise;
	
	/*github.repos.getTags({user:userName, repo: repoName, per_page:100}, function(err,res){

		if(err !== null)
		{
			console.log("error", err);
			return;
		}
		else
		{
			var tags = [];
			for(var i=0;i<res.length;i++)
			{
				var tagData = res[i];	
				var sha = tagData.commit.sha;
				var name = tagData.name;
				var tag = {name:tagData.name, sha:tagData.commit.sha}
				Q.fcall(getTagDate, sha, tag); //getTagDate(sha, tag);
			}
		}
	});*/
}

//STEP 2
function getIssuesInTimeFrame(tags)
{
	/*retrieve issues in timeframes, generally between two tags*/
	var issuesPerTimeFrameDeferred = Q.defer();
	var startDate = "2010-12-02T23:11:24Z";//"1950-01-01T00:00:00Z";
	var endDate = "";
	

	getAllIssues().then(structureInTimeFrame);

	/*
	var promises = []
	tags.sort(compareTags);

	for(var i=0;i<tags.length;i++)
	{
		var tag = tags[i];
		endDate = tag.date;
		//process issues in timeframe
		deferred = getAllIssues();
		promises.push(deferred.promise)
		startDate = tag.date;
	}

	Q.all(promises).then(structureInTimeFrame);*/
	
	function structureInTimeFrame(issues)
	{

		//console.log("issues", JSON.stringify(issues));
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
			}
			
			var issues = [];
			var issueEventsPromises = [];

			for(var i=0;i<res.length;i++)
			{
				var issueData = res[i];
				//IMPORTANT : cannot use issue.closed_at : unreliable timestamp !!
				console.log("issue", issueData.number, "original closed at", issueData.closed_at);
				var issue = {title:issueData.title,closed_at:issueData.closed_at, number:issueData.number};
				issues.push(issue);

				var subDeferred = getIssueEvents(issue);
				issueEventsPromises.push(subDeferred.promise);
			}
			Q.all(issueEventsPromises).then(function(){
				deferred.resolve(issues)
			});
		});
		return deferred.promise;
	}


	function getIssuesFromDateToDate(startDate, endDate, tag)
	{
		console.log("proccessing issues between", startDate, endDate, "for tag", tag.name);
		var eDate = new Date(endDate);

		var deferred = Q.defer();
		github.issues.repoIssues({user:userName, repo: repoName,state:"closed",direction:"asc", sort:"updated",since:startDate}, function(err,res){
			if(err !== null)
			{
				console.log("error", err);
				defered.reject(error);
			}
			var issuesInTimeFrame = [];
			var issueEventsPromises = [];

			for(var i=0;i<res.length;i++)
			{
				var issueData = res[i];
				//console.log("bla", JSON.stringify(issueData));
				//IMPORTANT : cannot use issue.closed_at : unreliable timestamp !!
				var issue = {title:issueData.title, number:issueData.number};
				var closedDate = new Date(issue.closed_at);

				console.log(issue.title,"closed on", closedDate ,"tag date", eDate, tag.name,tag.sha);
				if (closedDate > eDate)
				{
					var sDate = new Date(startDate);
					console.log("outside bounds");
					break;
				}
				
				issuesInTimeFrame.push(issue);

				var subDeferred = getIssueEvents(issue);
				issueEventsPromises.push(subDeferred.promise);
				//
				//closedDate > eD ? break;
			}

			tag.items = issuesInTimeFrame;

			Q.all(issueEventsPromises).then(function(){
				deferred.resolve(issuesInTimeFrame)
			});
			
		});
		return deferred.promise;
	}
	return issuesPerTimeFrameDeferred.promise;
}


//STEP3
function generateChangeLog(tags)
{
	tags.forEach(function(tag)
	{
		console.log(formatTag(tag));
		//console.log("tag items", tag.items.length);
		tag.items.forEach(function(item)
		{
			item = formatIssue(item);
			console.log("   -", item.status, item.title);
		});
		console.log(" ");
		//console.log("issue :" , issue.number, " ", issue.title, " ",issue.state, " closed at ",issue.closed_at);
	});

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
	issue.title = issue.title.charAt(0).toLowerCase()+ issue.title.slice(1);;

	if(!("status" in issue) )
	{
		issue.status = "Done:";
	}
	//console.log("- ", issue.status,issue.title);//,"closed_at",issue.closed_at);
	return issue
}

function formatTag(tag)
{
	var tagFormated = repoName+":"+tag.name+"\n"+"==============="
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
			deferred.reject(err);
		}
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
			deferred.reject(err);
		}
		var commit = res;
		var message = commit.message;
		issue.closed_at = commit.committer.date;
		//console.log("commit", message, "when:", commit.committer.date);
		console.log("issue", issue.number, "final closed at", new Date(commit.committer.date));

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
	});
	return deferred;
}


getTags().then(getIssuesInTimeFrame).then(generateChangeLog);

/*
getTags().then(getIssuesInTimeFrame).then(function(tags){
	tags.forEach(function(tag)
	{
		console.log("Tag: ",tag.name, tag.items);
	});
	
});*/

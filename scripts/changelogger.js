var GitHubApi = require("github");

var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    timeout: 5000
});


github.authenticate({
    type: "basic",
    username: "kaosat-dev",
    password: ""
});


function generateChangeLog()
{

}

function getTagDeltaIssues(startTag, endTag)
{
	
}


function getIssuesFromDateToDate(startDate, endDate)
{
	var startDate = "2012-06-03T11:56:31Z";
	var endDate = "2012-11-03T11:56:31Z";
	var sD = new Date(startDate);
	var eD = new Date(endDate);
	var issuesInTimeFrame = [];
	
	github.issues.repoIssues({user:"kaosat-dev", repo: "OpenCoffeeSCad",state:"closed",direction:"asc", sort:"updated",since:startDate}, function(err,res){

		console.log("error", err);

		for(var i=0;i<res.length;i++)
		{
			var issue = res[i];
			console.log("issue :" , issue.number, " ", issue.title, " ",issue.state, " closed at ",issue.closed_at);
			var closedDate = new Date(issue.closed_at);
			if (closedDate > eD)
			{
				break;
			}
			issuesInTimeFrame.push(issue);
		}
		//console.log("oh yeah issues", JSON.stringify(res));
		//console.log("oh yeah issues", JSON.stringify(issuesInTimeFrame));
	});

}

function getTagData(user, repo, sha)
{
	
}

/*github.repos.getTags({user:"kaosat-dev", repo: "OpenCoffeeSCad"}, function(err,res){

	if(err !== null)
	{
		console.log("error", err);
	}
	else
	{
		var tags = [];
		for(var i=0;i<res.length;i++)
		{
			var tag = res[i];	
			var date = "";
			var sha = tag.commit.sha;
			


			github.gitdata.getCommit({user:"kaosat-dev", repo: "OpenCoffeeSCad", "sha":sha}, function(tagDataErr,tagDataRes){
				
				console.log("error", tagDataErr);
				
				//console.log("oh yeah commit data", JSON.stringify(tagDataRes)); 

				console.log("date", tagDataRes.committer.date);
				console.log("tag for version",tag.name," sha ", sha, "at date ", tagDataRes.committer.date );
				

			});

			//console.log("tag for version",tag.name," done at ", tag.tagger);
		}
		//"date": "2011-06-17T14:53:35-07:00".date
	}
	//console.log("oh yeah tags", JSON.stringify(res));
	
});*/

/*
github.issues.repoIssues({user:"kaosat-dev", repo: "OpenCoffeeSCad",state:"closed",direction:"desc"}, function(err,res){

	console.log("error", err);

	for(var i=0;i<res.length;i++)
	{
		var issue = res[i];
		console.log("issue :" , issue.number, " ", issue.title, " ",issue.state);
	}
	//console.log("oh yeah issues", JSON.stringify(res));
});*/
getIssuesFromDateToDate();


var oauth; 
var requestParams; 
var appBrowser;//instance of an InAppBrowser
var options = {
	consumerKey: 'jpVFaN2ljxpeVcxP8VIeHCF4C', // YOUR Twitter CONSUMER_KEY
	consumerSecret: 'YQPfEUDMmWufmK8xpxqWkruOxS0FKcOGGyvSxe7MIxXwDZg9HY', // YOUR Twitter CONSUMER_SECRET
	callbackUrl: window.location.host + window.location.pathname
};     
var twitterKey = "twtrKey"; // This key is used for storing Information related 
var screenName;

document.addEventListener('deviceready', function () {  
	var btnLogin = document.getElementById("cmdLogin");
	var cmdWTweet = document.getElementById("cmdWTweet");
	var cmdTimeline = document.getElementById("cmdTimeline");
	
	btnLogin.addEventListener("click", logInTwitter, false);
	cmdWTweet.addEventListener("click", tweet, false);
	cmdTimeline.addEventListener("click", getTimeline, false);
	app = new kendo.mobile.Application(document.body, {
										   skin: 'flat'
									   });
}, false);

//follow the Sign In Workflow https://dev.twitter.com/web/sign-in/implementing
function logInTwitter() {
	oauth = OAuth(options);
	//Step 1: Obtaining a request token
	oauth.get('https://api.twitter.com/oauth/request_token', 
			  function(data) {
				  requestParams = data.text;
				  //Step 2: Redirecting the user to authenticate using the received request token
				  appBrowser = window.open('https://api.twitter.com/oauth/authenticate?' + data.text, "_blank"); // This opens the Twitter authentication / sign in page
				  appBrowser.addEventListener('loadstart', function(event) {
					  authorized(event.url);
				  });
			  }, onError
		);
}

function authorized(loc) { 

	if (loc.indexOf(options.callbackUrl) >= 0) {
		console.log("Check location " + loc);   
		// Parse the returned URL
		var index, verifier = '';
		var params = loc.substr(loc.indexOf('?') + 1);
                                 
		params = params.split('&');
		for (var i = 0; i < params.length; i++) {
			var y = params[i].split('=');
			if (y[0] === 'oauth_verifier') {
				verifier = y[1];
			}
		}
		//Step 3: Converting the request token to an access token
		oauth.get('https://api.twitter.com/oauth/access_token?oauth_verifier=' + verifier + '&' + requestParams,
				  function(data) {
					  var accessParams = {};
					  var qvars_tmp = data.text.split('&');
					  for (var i = 0; i < qvars_tmp.length; i++) {
						  var y = qvars_tmp[i].split('=');
						  accessParams[y[0]] = decodeURIComponent(y[1]);
					  }         
					  oauth.setAccessToken([accessParams.oauth_token, accessParams.oauth_token_secret]);
                                           
					  // Saving token of access in Local_Storage
					  var accessData = {};
					  accessData.accessTokenKey = accessParams.oauth_token;
					  accessData.accessTokenSecret = accessParams.oauth_token_secret;
					  console.log("TWITTER: Storing token key/secret in localStorage");
					  localStorage.setItem(twitterKey, JSON.stringify(accessData));
					  //Determine the identity of the user by verifying their credentials
					  oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true', credentialsVerified, onError);
				  },
				  onError
			);
		appBrowser.close();
	} 
}

function credentialsVerified(data) {
	
	var entry = JSON.parse(data.text);
	screeenName = entry.screen_name;
	console.log("TWITTER USER: " + entry.screen_name);
	$("#main").css("display", "block");
	$("#username").text(entry.screen_name);
}

function onError(error) {
	console.log("ERROR: " + error);
}
function tweet() {
	var storedAccessData, rawData = localStorage.getItem(twitterKey);
                             
	storedAccessData = JSON.parse(rawData); 
	options.accessTokenKey = storedAccessData.accessTokenKey; 
	options.accessTokenSecret = storedAccessData.accessTokenSecret;
                             
	//Check the identity of the user again by verifying their credentials
	oauth = OAuth(options);
	oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true',
			  function(data) {
				  var entry = JSON.parse(data.text);
				  var tweetContent = $("#tweetContent").val(); // Get the content of the tweet
				  //Post a status update https://dev.twitter.com/rest/reference/post/statuses/update        
				  oauth.post('https://api.twitter.com/1.1/statuses/update.json', {
								 'status' : tweetContent,  // javascript OAuth encodes this
							 },
							 function(data) {
								 var entry = JSON.parse(data.text);
								 console.log(entry);
							 },
							 onError
					  );      
			  });
}
function getTimeline() {
	oauth.get("https://api.twitter.com/1.1/statuses/user_timeline.json?count=20&screen_name=" + screeenName,
			  function(result) {
				  var tweets = JSON.parse(result.text);
				  var tweetDataSource = new kendo.data.DataSource({
																	  data: tweets
																  });
				  $("#tweets").kendoMobileListView({
													   dataSource: tweetDataSource,
													   template:$("#tweetTemplate").html()
												   });
			  },
			  onError
		);      
}
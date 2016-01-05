var https = require('https');
var util = require('util');

var slackChannel = process.env.SLACK_CHANNEL || "#YOUR_SLACK_CHANNEL"
var slackWebhookPath = process.env.SLACK_WEBHOOK_PATH || "/services/$YOUR_WEBHOOK_PATH"

exports.handler = function(event, context) {
    console.log(JSON.stringify(event, null, 2));
    console.log('From SNS:', event.Records[0].Sns.Message);

    var postData = {
        "channel": slackChannel,
        "username": "AWS SNS",
        "text": "*" + event.Records[0].Sns.Subject + "*",
        "icon_emoji": ":alarm_clock:"
    };

    var message = event.Records[0].Sns.Message;
    var butWithErrors = message.indexOf(" but with errors");
    var stateRed = message.indexOf(" to RED");
    var stateYellow = message.indexOf(" to YELLOW");
    var noPermission = message.indexOf("You do not have permission");
    var failedDeploy = message.indexOf("Failed to deploy application");
    var removedInstance = message.indexOf("Removed instance ");
    var addingInstance = message.indexOf("Adding instance ");
    var failedConfig = message.indexOf("Failed to deploy configuration");
    var failedQuota = message.indexOf("Your quota allows for 0 more running instance");
    var abortedOperation = message.indexOf(" aborted operation.");
    var color = "good";
    
    if (stateRed != -1 || butWithErrors != -1 || noPermission != -1 || failedDeploy != -1 || failedConfig != -1 || failedQuota != -1) {
        color = "danger";
    }
    if (stateYellow != -1 || removedInstance != -1 || addingInstance != -1 || abortedOperation != -1) {
        color = "warning";
    }

    postData.attachments = [
        {
            "color": color, 
            "text": message
        }
    ];

    var options = {
        method: 'POST',
        hostname: 'hooks.slack.com',
        port: 443,
        path: slackWebhookPath
    };

    var req = https.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        context.done(null);
      });
    });
    
    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });    

    req.write(util.format("%j", postData));
    req.end();
};
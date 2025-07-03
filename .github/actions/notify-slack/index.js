const core = require('@actions/core');
const github = require('@actions/github');
const https = require('https');

async function run() {
  try {
    const webhook = core.getInput('slack-webhook-url');
    console.log("Webhook URL received:", webhook);

    const { action, pull_request: pr } = github.context.payload;

    const simpleText = `New PR ${action}: "${pr.title}" by @${pr.user.login}\nLink: ${pr.html_url}`;

    const payload = JSON.stringify({ text: simpleText });
    const url = new URL(webhook);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Slack response: ${res.statusCode}`);
    });

    req.on('error', (error) => {
      core.setFailed(`Error: ${error.message}`);
    });

    req.write(payload);
    req.end();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

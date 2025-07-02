const core = require('@actions/core');
const github = require('@actions/github');
const https = require('https');

async function run() {
  try {
    const webhook = core.getInput('slack-webhook-url');
    const includeLabels = core.getInput('include-labels') === 'true';

    const { action, pull_request: pr } = github.context.payload;

    const status = action === 'opened' ? '🟦 *Opened*'
                 : action === 'closed' && pr.merged ? '🟩 *Merged*'
                 : action === 'closed' ? '🟥 *Closed*'
                 : `⚪ *${action}*`;

    const labels = includeLabels && pr.labels.length > 0
      ? `🏷️ Labels: ${pr.labels.map(label => label.name).join(', ')}\n`
      : '';

    const message = {
      text: `🔔 *Pull Request Notification*\n${status}\n📝 *${pr.title}*\n👤 by @${pr.user.login}\n${labels}🔗 <${pr.html_url}|View PR>`
    };

    const payload = JSON.stringify(message);
    const url = new URL(webhook);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
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

const core = require('@actions/core');
const github = require('@actions/github');
const https = require('https');


const token = core.getInput('github-token');
const octokit = github.getOctokit(token);

const prNumber = pr.number;
const { owner, repo } = github.context.repo;

const { data: files } = await octokit.rest.pulls.listFiles({
  owner,
  repo,
  pull_number: prNumber,
});

const changedFilesText = files.map(f => `• ${f.filename}`).join('\n');
const fileSummary = `📄 *Changed Files:*\n${changedFilesText}\n`;


async function run() {
  try {
    const webhook = core.getInput('slack-webhook-url');
    console.log("Webhook URL received:", webhook);

    const { action, pull_request: pr } = github.context.payload;

    const simpleText =  `🔔 *Pull Request Notification*\n${status}\n📝 *${pr.title}*\n👤 by @${pr.user.login}\n${labels}${fileSummary}🔗 <${pr.html_url}|View PR>`;

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
// my pro
    req.write(payload);
    req.end();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

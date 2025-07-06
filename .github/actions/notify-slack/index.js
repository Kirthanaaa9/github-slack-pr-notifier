import { getInput, setFailed } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { request } from 'https';


async function run() {
  try {
    const webhook = getInput('slack-webhook-url');
    const includeLabels = getInput('include-labels') === 'true';
    const token = getInput('github-token');

    console.log("Webhook URL received:", webhook);

    const octokit = getOctokit(token);
    const { action, pull_request: pr } = context.payload;
    const { owner, repo } = context.repo;

    const status = action === 'opened' ? '🟦 *Opened*'
                 : action === 'closed' && pr.merged ? '🟩 *Merged*'
                 : action === 'closed' ? '🟥 *Closed*'
                 : `⚪ *${action}*`;

    const labels = includeLabels && pr.labels.length > 0
      ? `🏷️ Labels: ${pr.labels.map(label => label.name).join(', ')}\n`
      : '';

    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr.number,
    });

    const changedFilesText = files.map(f => `• ${f.filename}`).join('\n');
    const fileSummary = `📄 *Changed Files:*\n${changedFilesText}\n`;

    const message = {
      text: `🔔 *Pull Request Notification*\n${status}\n📝 *${pr.title}*\n👤 by @${pr.user.login}\n${labels}${fileSummary}🔗 <${pr.html_url}|View PR>`
    };

    const payload = JSON.stringify(message);
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

    const req = request(options, (res) => {
      console.log(`Slack response: ${res.statusCode}`);
    });

    req.on('error', (error) => {
      setFailed(`Error: ${error.message}`);
    });

    req.write(payload);
    req.end();
  } catch (error) {
    setFailed(error.message);
  }
}

run();

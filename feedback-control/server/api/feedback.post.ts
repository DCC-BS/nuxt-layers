import { defineEventHandler, readBody } from "h3";
import { $fetch } from "ofetch";
import { EnvHttpProxyAgent } from "undici";
import type { FeedbackAttachment } from "../../shared/types/feedbackBody";

type GhFileUploadResponse = {
  content: {
    name: string;
    path: string;
    url: string;
    download_url: string;
    html_url: string;
  };
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { message, rating, email, attachments } = bodySchema.parse(body);

  const config = useRuntimeConfig().feedback;

  const githubToken = config.githubToken ?? process.env.GITHUB_TOKEN;
  const repo = config.repo;
  const owner = config.repoOwner;
  const project = config.project;

  let messageWithDetails = message;

  if (rating) {
    messageWithDetails += `Rating: ${rating}\n\n${message}`;
  }

  if (email) {
    messageWithDetails += `\n\nContact Email: ${email}`;
  }

  if (attachments && attachments.length > 0) {
    const uploadedAttachments = await uploadAttachments(
      owner,
      repo,
      githubToken,
      attachments,
    );

    messageWithDetails += "\n\nAttachments:\n";
    for (const { name, url } of uploadedAttachments) {
      messageWithDetails += `- [${name}](${url})\n`;
    }
  }

  const title = `${project} - ${message.substring(0, 20)}`;

  const agent = new EnvHttpProxyAgent();

  await $fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    dispatcher: agent,
    body: {
      title: title,
      body: messageWithDetails,
      labels: [project, "feedback"],
    },
  });

  return {
    status: 200,
    message: "ok",
  };
});

async function uploadAttachments(
  owner: string,
  repo: string,
  githubToken: string,
  attachments: FeedbackAttachment[],
) {
  const agent = new EnvHttpProxyAgent();

  const fileUrls = [];

  for (const attachment of attachments) {
    const ext = attachment.fileName.split(".").pop();
    const newFileName = `${uuid()}.${ext}`;
    const response = await $fetch<GhFileUploadResponse>(
      `https://api.github.com/repos/${owner}/${repo}/contents/attachments/${newFileName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
          Accept: "application/vnd.github+json",
        },
        dispatcher: agent,
        body: {
          message: "Upload Feedback attachment",
          content: attachment.base64,
          committer: {
            name: "DCC-BS",
            email: "dcc@bs.ch",
          },
        },
      },
    );

    fileUrls.push({
      name: attachment.fileName,
      url: response.content.html_url,
    });
  }

  return fileUrls;
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

import fs from 'fs';
import path from 'path';

interface CommitFileParams {
  filePath: string;
  content: string | Buffer;
  commitMessage: string;
}

/**
 * Save file helper supporting both local filesystem and Vercel read-only filesystem.
 * On Vercel, commits and pushes changes directly to GitHub via REST API.
 */
export async function saveFileContent({
  filePath,
  content,
  commitMessage,
}: CommitFileParams): Promise<void> {
  const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const absoluteLocalPath = path.join(process.cwd(), ...normalizedPath.split('/'));

  // 1. Try writing to local filesystem first
  try {
    const parentDir = path.dirname(absoluteLocalPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    const contentStr = typeof content === 'string' ? content : content.toString('utf-8');
    fs.writeFileSync(absoluteLocalPath, contentStr, 'utf-8');
  } catch (fsError: any) {
    // Ignore EROFS error on Vercel Serverless environment
    if (fsError?.code !== 'EROFS' && !fsError?.message?.includes('read-only')) {
      throw fsError;
    }
  }

  // 2. Commit to GitHub API when running on Vercel or when token is present
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'HikariAkiraa';
  const repo = process.env.GITHUB_REPO || 'learn-digi-vercel';
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token) {
    if (process.env.VERCEL === '1') {
      throw new Error(
        'Read-only serverless filesystem. Missing GITHUB_PERSONAL_ACCESS_TOKEN in Vercel environment variables.'
      );
    }
    return;
  }

  const base64Content = (typeof content === 'string' ? Buffer.from(content) : content).toString(
    'base64'
  );
  const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${normalizedPath}`;

  // Get current file sha if existing
  let sha: string | undefined = undefined;
  try {
    const getRes = await fetch(`${githubApiUrl}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'DigitalLab-Admin',
      },
      cache: 'no-store',
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }
  } catch (e) {}

  const putRes = await fetch(githubApiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'DigitalLab-Admin',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: base64Content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const errData = await putRes.json().catch(() => ({}));
    throw new Error(errData.message || `GitHub API error: ${putRes.status}`);
  }
}

/**
 * Delete file helper supporting both local filesystem and Vercel read-only filesystem via GitHub REST API.
 */
export async function deleteFileFromGitHub({
  filePath,
  commitMessage,
}: {
  filePath: string;
  commitMessage: string;
}): Promise<void> {
  const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const absoluteLocalPath = path.join(process.cwd(), ...normalizedPath.split('/'));

  // 1. Try local filesystem
  try {
    if (fs.existsSync(absoluteLocalPath)) {
      fs.unlinkSync(absoluteLocalPath);
    }
  } catch (fsError: any) {
    if (fsError?.code !== 'EROFS' && !fsError?.message?.includes('read-only')) {
      throw fsError;
    }
  }

  // 2. Delete from GitHub REST API
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'HikariAkiraa';
  const repo = process.env.GITHUB_REPO || 'learn-digi-vercel';
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token) return;

  const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${normalizedPath}`;
  let sha: string | undefined = undefined;
  try {
    const getRes = await fetch(`${githubApiUrl}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'DigitalLab-Admin',
      },
      cache: 'no-store',
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }
  } catch (e) {}

  if (sha) {
    await fetch(githubApiUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'DigitalLab-Admin',
      },
      body: JSON.stringify({
        message: commitMessage,
        sha,
        branch,
      }),
    });
  }
}

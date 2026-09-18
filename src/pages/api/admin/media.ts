import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

const GITHUB_REPO = 'Vinuga530/Powernet-Site';

// Files that should never be deleted
const PROTECTED_FILES = new Set([
  '.gitkeep',
  'favicon.ico',
  'favicon.svg',
  'site.webmanifest',
  'powernet-logo-coloured.png',
]);

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

function collectReferencedAssets(srcDir: string): Map<string, string[]> {
  const usageMap = new Map<string, string[]>();
  const textFiles = getAllFiles(srcDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.yaml', '.yml', '.astro', '.ts', '.js', '.jsx', '.tsx', '.json', '.md', '.mdx', '.css'].includes(ext);
  });

  for (const file of textFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const relativeFile = path.relative(srcDir, file).replace(/\\/g, '/');

      // Match patterns like /images/... or /videos/...
      const matches = content.match(/["']?(\/(images|videos)\/[^"'\s\n\r]+)/g);
      if (matches) {
        for (const rawMatch of matches) {
          const cleaned = rawMatch.replace(/^['"]/, '').replace(/['",;]$/, '').trim();
          const normSlash = cleaned.replace(/\\/g, '/');
          const fileName = path.basename(cleaned).toLowerCase();

          const existing = usageMap.get(normSlash) || [];
          if (!existing.includes(relativeFile)) existing.push(relativeFile);
          usageMap.set(normSlash, existing);

          const existingByFn = usageMap.get(fileName) || [];
          if (!existingByFn.includes(relativeFile)) existingByFn.push(relativeFile);
          usageMap.set(fileName, existingByFn);
        }
      }

      // Match filenames
      const fnMatches = content.match(/[\w\-.]+\.(png|jpe?g|webp|svg|mp4|webm|gif|avif)/gi);
      if (fnMatches) {
        for (const fn of fnMatches) {
          const fnLower = fn.toLowerCase();
          const existing = usageMap.get(fnLower) || [];
          if (!existing.includes(relativeFile)) existing.push(relativeFile);
          usageMap.set(fnLower, existing);
        }
      }
    } catch {
      // Ignore
    }
  }

  return usageMap;
}

export const GET: APIRoute = async ({ request }) => {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const srcDir = path.join(rootDir, 'src');

  const managedDirs = [
    { category: 'Projects', dir: path.join(publicDir, 'images', 'projects') },
    { category: 'Logos', dir: path.join(publicDir, 'images', 'logos') },
    { category: 'Hero Images', dir: path.join(publicDir, 'images', 'hero') },
    { category: 'Hero Videos', dir: path.join(publicDir, 'videos', 'hero') },
  ];

  const usageMap = collectReferencedAssets(srcDir);
  const mediaItems = [];

  for (const group of managedDirs) {
    if (!fs.existsSync(group.dir)) continue;
    const files = getAllFiles(group.dir);

    for (const filePath of files) {
      const fileName = path.basename(filePath);
      if (PROTECTED_FILES.has(fileName.toLowerCase())) continue;

      const relPathSlash = '/' + path.relative(publicDir, filePath).replace(/\\/g, '/');
      const relPathNoSlash = relPathSlash.slice(1);
      const isVideo = ['.mp4', '.webm', '.mov', '.ogg'].includes(path.extname(filePath).toLowerCase());

      const usedIn = usageMap.get(relPathSlash) || usageMap.get(relPathNoSlash) || usageMap.get(fileName.toLowerCase()) || [];
      const stats = fs.statSync(filePath);

      mediaItems.push({
        name: fileName,
        path: relPathSlash,
        category: group.category,
        size: stats.size,
        isVideo,
        inUse: usedIn.length > 0,
        usedIn: usedIn,
      });
    }
  }

  return new Response(JSON.stringify({ files: mediaItems }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { paths = [] } = body;

    if (!Array.isArray(paths) || paths.length === 0) {
      return new Response(JSON.stringify({ error: 'No file paths provided to delete.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rootDir = process.cwd();
    const publicDir = path.join(rootDir, 'public');
    const isDev = import.meta.env.DEV;
    const deleted = [];
    const errors = [];

    // Check for Keystatic GitHub auth token if in production
    const ghToken = cookies.get('keystatic-gh-access-token')?.value || request.headers.get('x-github-token');

    for (const relPath of paths) {
      // Security: ensure the path is inside public/
      const cleanRel = relPath.replace(/^[\/\\]+/, '');
      const fullPath = path.resolve(publicDir, cleanRel);
      const fileName = path.basename(fullPath);

      if (PROTECTED_FILES.has(fileName.toLowerCase())) {
        errors.push(`Cannot delete protected file: ${fileName}`);
        continue;
      }

      if (!fullPath.startsWith(path.resolve(publicDir))) {
        errors.push(`Invalid path: ${relPath}`);
        continue;
      }

      if (isDev) {
        // Local mode: delete directly from disk
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          deleted.push(relPath);

          // Clean empty parent folder if inside projects/
          const parentDir = path.dirname(fullPath);
          if (parentDir !== publicDir && fs.existsSync(parentDir)) {
            const rem = fs.readdirSync(parentDir);
            if (rem.length === 0) {
              try { fs.rmdirSync(parentDir); } catch {}
            }
          }
        }
      } else {
        // Production on Vercel: Delete via GitHub API
        if (!ghToken) {
          errors.push(`Not authenticated. Please log in at /keystatic or provide a GitHub token to delete in production.`);
          continue;
        }

        try {
          const ghPath = `public/${cleanRel}`.replace(/\\/g, '/');
          // 1. Get file SHA
          const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${ghPath}?ref=main`, {
            headers: {
              'Authorization': `Bearer ${ghToken}`,
              'Accept': 'application/vnd.github+json',
              'User-Agent': 'Powernet-CMS-Cleanup',
            },
          });

          if (!getRes.ok) {
            errors.push(`File not found on GitHub: ${cleanRel}`);
            continue;
          }

          const fileData = await getRes.json();
          const sha = fileData.sha;

          // 2. Delete file on GitHub
          const delRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${ghPath}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${ghToken}`,
              'Accept': 'application/vnd.github+json',
              'User-Agent': 'Powernet-CMS-Cleanup',
            },
            body: JSON.stringify({
              message: `chore: remove media ${fileName} via CMS Media Manager`,
              sha: sha,
              branch: 'main',
            }),
          });

          if (delRes.ok) {
            deleted.push(relPath);
          } else {
            const errData = await delRes.json();
            errors.push(`GitHub delete failed for ${fileName}: ${errData.message}`);
          }
        } catch (err: any) {
          errors.push(`Error deleting ${fileName}: ${err.message}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, deleted, errors }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

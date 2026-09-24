import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

const GITHUB_REPO = 'Vinuga530/Powernet-Site';

// Files that should never be deleted under any circumstance
const PROTECTED_FILES = new Set([
  '.gitkeep',
  'favicon.ico',
  'favicon.svg',
  'site.webmanifest',
  'powernet-logo-coloured.png',
  'apple-touch-icon.png',
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
  if (!fs.existsSync(srcDir)) return usageMap;

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

      // Match filenames with extensions
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
      // Ignore read errors
    }
  }

  return usageMap;
}

export const GET: APIRoute = async ({ request, cookies }) => {
  // ── AUTH GATE ──────────────────────────────────────────────────────────────
  const ghToken =
    cookies.get('keystatic-gh-access-token')?.value ||
    request.headers.get('cookie')?.match(/keystatic-gh-access-token=([^;]+)/)?.[1] ||
    request.headers.get('x-github-token') ||
    process.env.KEYSTATIC_GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN;

  if (!import.meta.env.DEV && !ghToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Please log in via /keystatic.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Cookie realm="Keystatic"' },
    });
  }
  // ──────────────────────────────────────────────────────────────────────────

  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const srcDir = path.join(rootDir, 'src');

  const managedDirs = [
    { category: 'Projects', dir: path.join(publicDir, 'images', 'projects'), prefix: 'public/images/projects/' },
    { category: 'Logos', dir: path.join(publicDir, 'images', 'logos'), prefix: 'public/images/logos/' },
    { category: 'Hero Images', dir: path.join(publicDir, 'images', 'hero'), prefix: 'public/images/hero/' },
    { category: 'Hero Videos', dir: path.join(publicDir, 'videos', 'hero'), prefix: 'public/videos/hero/' },
  ];

  const usageMap = collectReferencedAssets(srcDir);
  let mediaItems: any[] = [];

  // 1. Try local filesystem first
  let localFilesFound = 0;
  for (const group of managedDirs) {
    if (fs.existsSync(group.dir)) {
      const files = getAllFiles(group.dir);
      for (const filePath of files) {
        const fileName = path.basename(filePath);
        if (PROTECTED_FILES.has(fileName.toLowerCase())) continue;

        const relPathSlash = '/' + path.relative(publicDir, filePath).replace(/\\/g, '/');
        const relPathNoSlash = relPathSlash.slice(1);
        const isVideo = ['.mp4', '.webm', '.mov', '.ogg'].includes(path.extname(filePath).toLowerCase());

        const usedIn = usageMap.get(relPathSlash) || usageMap.get(relPathNoSlash) || usageMap.get(fileName.toLowerCase()) || [];
        let size = 0;
        try {
          size = fs.statSync(filePath).size;
        } catch {}

        localFilesFound++;
        mediaItems.push({
          name: fileName,
          path: relPathSlash,
          category: group.category,
          size,
          isVideo,
          inUse: usedIn.length > 0,
          usedIn,
        });
      }
    }
  }

  // 2. If no local files found (production Vercel lambda), query GitHub Git Tree API
  if (localFilesFound === 0) {
    const ghToken =
      cookies.get('keystatic-gh-access-token')?.value ||
      request.headers.get('cookie')?.match(/keystatic-gh-access-token=([^;]+)/)?.[1] ||
      request.headers.get('x-github-token') ||
      process.env.KEYSTATIC_GITHUB_TOKEN ||
      process.env.GITHUB_TOKEN ||
      process.env.GH_TOKEN;

    try {
      const ghHeaders: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Powernet-CMS-MediaManager',
      };
      if (ghToken) {
        ghHeaders['Authorization'] = `Bearer ${ghToken}`;
      }

      const treeRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/trees/main?recursive=1`, {
        headers: ghHeaders,
      });

      if (treeRes.ok) {
        const treeData = await treeRes.json();
        const treeItems = treeData.tree || [];

        for (const item of treeItems) {
          if (item.type !== 'blob') continue;
          const ghPath: string = item.path; // e.g. "public/images/logos/boc.png"
          const fileName = path.basename(ghPath);
          if (PROTECTED_FILES.has(fileName.toLowerCase())) continue;

          let matchedCat: string | null = null;
          for (const group of managedDirs) {
            if (ghPath.startsWith(group.prefix)) {
              matchedCat = group.category;
              break;
            }
          }

          if (matchedCat) {
            const relPathSlash = '/' + ghPath.replace(/^public\//, '');
            const isVideo = ['.mp4', '.webm', '.mov', '.ogg'].includes(path.extname(fileName).toLowerCase());
            const usedIn = usageMap.get(relPathSlash) || usageMap.get(fileName.toLowerCase()) || [];

            mediaItems.push({
              name: fileName,
              path: relPathSlash,
              category: matchedCat,
              size: item.size || 0,
              isVideo,
              inUse: usedIn.length > 0,
              usedIn,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching GitHub tree:', err);
    }
  }

  return new Response(
    JSON.stringify({
      files: mediaItems,
      totalCount: mediaItems.length,
      unusedCount: mediaItems.filter((m) => !m.inUse).length,
      isDev: import.meta.env.DEV,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
};

export const POST: APIRoute = async ({ request, cookies }) => {
  // ── AUTH GATE ──────────────────────────────────────────────────────────────
  // POST deletes files — always require auth, even in dev.
  const ghToken =
    cookies.get('keystatic-gh-access-token')?.value ||
    request.headers.get('cookie')?.match(/keystatic-gh-access-token=([^;]+)/)?.[1] ||
    request.headers.get('x-github-token') ||
    process.env.KEYSTATIC_GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN;

  if (!ghToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Please log in via /keystatic first.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Cookie realm="Keystatic"' },
    });
  }
  // ──────────────────────────────────────────────────────────────────────────

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
    const deleted: string[] = [];
    const errors: string[] = [];

    // ghToken is already validated in the auth gate above
    for (const relPath of paths) {
      const cleanRel = relPath.replace(/^[\/\\]+/, '');
      const fullPath = path.resolve(publicDir, cleanRel);
      const fileName = path.basename(fullPath);

      if (PROTECTED_FILES.has(fileName.toLowerCase())) {
        errors.push(`Cannot delete protected file: ${fileName}`);
        continue;
      }

      if (isDev) {
        // Local mode: delete directly from disk
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
            deleted.push(relPath);

            // Clean empty parent folder if inside projects/
            const parentDir = path.dirname(fullPath);
            if (parentDir !== publicDir && fs.existsSync(parentDir)) {
              const rem = fs.readdirSync(parentDir);
              if (rem.length === 0) {
                try {
                  fs.rmdirSync(parentDir);
                } catch {}
              }
            }
          } catch (err: any) {
            errors.push(`Failed to delete local file ${fileName}: ${err.message}`);
          }
        } else {
          // If file not on disk locally, still mark as deleted
          deleted.push(relPath);
        }
      } else {
        // Production mode on Vercel: Delete via GitHub API directly on the repository
        if (!ghToken) {
          errors.push(`Not authenticated with GitHub. Please log into Keystatic at /keystatic first.`);
          continue;
        }

        try {
          const ghPath = `public/${cleanRel}`.replace(/\\/g, '/');

          // 1. Get file SHA from GitHub
          const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${ghPath}?ref=main`, {
            headers: {
              'Authorization': `Bearer ${ghToken}`,
              'Accept': 'application/vnd.github+json',
              'User-Agent': 'Powernet-CMS-Cleanup',
            },
          });

          if (!getRes.ok) {
            // Check if already deleted
            if (getRes.status === 404) {
              deleted.push(relPath);
              continue;
            }
            const errData = await getRes.json().catch(() => ({}));
            errors.push(`Could not find ${cleanRel} on GitHub (${errData.message || getRes.statusText})`);
            continue;
          }

          const fileData = await getRes.json();
          const sha = fileData.sha;

          // 2. Delete file via GitHub Contents API
          const delRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${ghPath}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${ghToken}`,
              'Accept': 'application/vnd.github+json',
              'User-Agent': 'Powernet-CMS-Cleanup',
            },
            body: JSON.stringify({
              message: `chore(media): delete ${fileName} via CMS Media Manager`,
              sha: sha,
              branch: 'main',
            }),
          });

          if (delRes.ok) {
            deleted.push(relPath);
          } else {
            const errData = await delRes.json().catch(() => ({}));
            errors.push(`GitHub delete failed for ${fileName}: ${errData.message || delRes.statusText}`);
          }
        } catch (err: any) {
          errors.push(`Error deleting ${fileName} via GitHub API: ${err.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        deleted,
        errors,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

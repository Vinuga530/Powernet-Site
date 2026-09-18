import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const CONTENT_DIR = path.join(SRC_DIR, 'content');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Managed media folders where CMS uploads go
const MANAGED_DIRS = [
  path.join(PUBLIC_DIR, 'images', 'projects'),
  path.join(PUBLIC_DIR, 'images', 'logos'),
  path.join(PUBLIC_DIR, 'images', 'hero'),
  path.join(PUBLIC_DIR, 'videos', 'hero'),
];

// Files that should never be removed
const PROTECTED_FILENAMES = new Set([
  '.gitkeep',
  'favicon.ico',
  'favicon.svg',
  'site.webmanifest',
  'powernet-logo-coloured.png',
]);

const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

/**
 * Recursively find all files in a directory.
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
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

/**
 * Format bytes to human-readable size.
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Scan all text in src/ and src/content/ to collect all referenced media filenames / paths.
 */
function collectReferencedAssets() {
  const referenced = new Set();
  const textFiles = getAllFiles(SRC_DIR).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.yaml', '.yml', '.astro', '.ts', '.js', '.jsx', '.tsx', '.json', '.md', '.mdx', '.css'].includes(ext);
  });

  for (const file of textFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Match patterns like /images/... or /videos/... with file extensions
      const matches = content.match(/["']?(\/(images|videos)\/[^"'\s\n\r]+)/g);
      if (matches) {
        for (const rawMatch of matches) {
          // Clean quotes, semicolons, or commas from regex capture
          const cleaned = rawMatch.replace(/^['"]/, '').replace(/['",;]$/, '').trim();
          referenced.add(cleaned);
          // Also track just the basename and normalized relative path
          referenced.add(path.normalize(cleaned).replace(/^[\\/]/, ''));
          referenced.add(path.basename(cleaned));
        }
      }

      // Also track any direct filename references (e.g. image.jpg, boc.png)
      const filenameMatches = content.match(/[\w\-.]+\.(png|jpe?g|webp|svg|mp4|webm|gif|avif)/gi);
      if (filenameMatches) {
        for (const fn of filenameMatches) {
          referenced.add(fn.toLowerCase());
        }
      }
    } catch {
      // Ignore unreadable files
    }
  }

  return referenced;
}

/**
 * Clean up empty directories recursively.
 */
function removeEmptyDirs(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let removedCount = 0;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDirPath = path.join(dirPath, entry.name);
      removedCount += removeEmptyDirs(subDirPath);
    }
  }

  // Check if directory is now empty (ignoring nothing)
  const remaining = fs.readdirSync(dirPath);
  if (remaining.length === 0) {
    if (!isDryRun) {
      try {
        fs.rmdirSync(dirPath);
      } catch {
        // Ignore if directory cannot be removed
      }
    }
    removedCount++;
  }

  return removedCount;
}

function runCleanup() {
  console.log('🔍 Powernet Media Cleanup Tool');
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (preview only, no files deleted)' : 'ACTIVE CLEANUP'}`);
  console.log('----------------------------------------------------');

  const referenced = collectReferencedAssets();
  console.log(`✓ Scanned source files: identified active media references.`);

  let totalOrphanedCount = 0;
  let totalBytesFreed = 0;
  const filesToDelete = [];

  for (const managedDir of MANAGED_DIRS) {
    if (!fs.existsSync(managedDir)) continue;

    const files = getAllFiles(managedDir);
    for (const filePath of files) {
      const fileName = path.basename(filePath);
      const relativeFromPublic = '/' + path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');
      const relativeNoSlash = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');

      // Skip protected files
      if (PROTECTED_FILENAMES.has(fileName.toLowerCase())) {
        continue;
      }

      // Check if file is referenced
      const isReferenced =
        referenced.has(relativeFromPublic) ||
        referenced.has(relativeNoSlash) ||
        referenced.has(fileName.toLowerCase()) ||
        referenced.has(fileName);

      if (!isReferenced) {
        const stats = fs.statSync(filePath);
        totalBytesFreed += stats.size;
        totalOrphanedCount++;
        filesToDelete.push({
          path: filePath,
          relative: path.relative(ROOT_DIR, filePath),
          size: stats.size,
        });
      }
    }
  }

  if (filesToDelete.length === 0) {
    console.log('✅ No unused media found. All assets are currently in use!');
    console.log('----------------------------------------------------');
    return;
  }

  console.log(`\nFound ${filesToDelete.length} unreferenced media file(s):`);
  for (const item of filesToDelete) {
    const sizeStr = formatBytes(item.size).padStart(10);
    if (isDryRun) {
      console.log(`  [WOULD DELETE] ${sizeStr}  ${item.relative}`);
    } else {
      try {
        fs.unlinkSync(item.path);
        console.log(`  [DELETED]      ${sizeStr}  ${item.relative}`);
      } catch (err) {
        console.error(`  [ERROR] Failed to delete ${item.relative}:`, err.message);
      }
    }
  }

  // Clean empty folders
  let emptyDirsRemoved = 0;
  for (const managedDir of MANAGED_DIRS) {
    emptyDirsRemoved += removeEmptyDirs(managedDir);
  }

  console.log('\n----------------------------------------------------');
  console.log(`Summary:`);
  console.log(`  Files ${isDryRun ? 'to remove' : 'removed'}:    ${totalOrphanedCount}`);
  console.log(`  Disk space ${isDryRun ? 'reclaimable' : 'freed'}:   ${formatBytes(totalBytesFreed)}`);
  if (emptyDirsRemoved > 0) {
    console.log(`  Empty directories cleaned: ${emptyDirsRemoved}`);
  }
  if (isDryRun) {
    console.log(`\nTo actually delete these files, run: npm run cleanup`);
  } else {
    console.log(`\n✅ Media cleanup complete! Site is running lean.`);
  }
  console.log('----------------------------------------------------\n');
}

runCleanup();

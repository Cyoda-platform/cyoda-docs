import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARBALL_NAME = (version, os, arch) => `cyoda_${version}_${os}_${arch}.tar.gz`;
const TARBALL_URL = (version, os, arch) =>
  `https://github.com/Cyoda-platform/cyoda-go/releases/download/v${version}/${TARBALL_NAME(version, os, arch)}`;
const SUMS_URL = (version) =>
  `https://github.com/Cyoda-platform/cyoda-go/releases/download/v${version}/SHA256SUMS`;

function err(cls, message) {
  return new Error(`${cls}: ${message}`);
}

export function parsePinFile(versionFilePath) {
  let raw;
  try {
    raw = fs.readFileSync(versionFilePath, 'utf8');
  } catch (cause) {
    throw err('InvalidVersionPin', `cannot read ${versionFilePath}: ${cause.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw err('InvalidVersionPin', `${versionFilePath}: not valid JSON: ${cause.message}. Expected { "version": "<semver>" }.`);
  }
  if (!parsed || typeof parsed.version !== 'string' || !parsed.version) {
    throw err('InvalidVersionPin', `${versionFilePath}: missing string "version". Expected { "version": "<semver>" }.`);
  }
  if (parsed.version.startsWith('v')) {
    throw err('InvalidVersionPin', `${versionFilePath}: version must not start with "v" (e.g. '0.6.1', not 'v0.6.1'). Got: ${parsed.version}`);
  }
  return parsed.version;
}

export function detectPlatform({ platform, arch }) {
  let os, archStr;
  if (platform === 'darwin') {
    os = 'darwin';
  } else if (platform === 'linux') {
    os = 'linux';
  } else {
    throw err('UnsupportedPlatform', `platform "${platform}" (arch "${arch}") is not supported. Only darwin and linux are supported. Windows users can install cyoda manually from https://github.com/Cyoda-platform/cyoda-go/releases.`);
  }
  if (arch === 'arm64') {
    archStr = 'arm64';
  } else if (arch === 'x64') {
    archStr = 'amd64';
  } else {
    throw err('UnsupportedPlatform', `arch "${arch}" on platform "${platform}" is not supported. Expected arm64 or x64.`);
  }
  return { os, arch: archStr };
}

function findChecksum(sumsText, filename) {
  for (const line of sumsText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[parts.length - 1] === filename) {
      return parts[0];
    }
  }
  return null;
}

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function fetchBytes(fetchFn, url, errorClass) {
  let resp;
  try {
    resp = await fetchFn(url);
  } catch (cause) {
    throw err('FetchFailed', `${url}: ${cause.message}.`);
  }
  if (!resp.ok) {
    throw err(errorClass, `HTTP ${resp.status} on ${url}. Check cyoda-go-version.json: does the tagged release include a build for this platform?`);
  }
  const buf = await resp.arrayBuffer();
  return Buffer.from(buf);
}

async function fetchText(fetchFn, url, errorClass) {
  const buf = await fetchBytes(fetchFn, url, errorClass);
  return buf.toString('utf8');
}

async function ensureBinary({ fetchFn, version, cacheDir, platformInfo }) {
  const binaryPath = path.join(cacheDir, 'cyoda');

  // Check if already cached and executable
  if (fs.existsSync(binaryPath)) {
    try {
      fs.accessSync(binaryPath, fs.constants.X_OK);
      return binaryPath;
    } catch {
      // not executable — re-download
    }
  }

  // Optional fast path: use the system binary if version matches
  const sysResult = spawnSync('cyoda', ['--version'], { encoding: 'utf8', timeout: 5000 });
  if (sysResult.status === 0 && sysResult.stdout && sysResult.stdout.includes(`${version} `)) {
    return 'cyoda';
  }

  const { os, arch } = platformInfo;
  const tarballName = TARBALL_NAME(version, os, arch);
  const tarballUrl = TARBALL_URL(version, os, arch);
  const sumsUrl = SUMS_URL(version);

  console.log(`  downloading ${tarballUrl}...`);

  const [tarballBuf, sumsText] = await Promise.all([
    fetchBytes(fetchFn, tarballUrl, 'BinaryNotFound'),
    fetchText(fetchFn, sumsUrl, 'FetchFailed'),
  ]);

  const expected = findChecksum(sumsText, tarballName);
  if (!expected) {
    throw err('IntegrityCheckFailed', `SHA256SUMS for v${version} has no entry for ${tarballName}.`);
  }
  const actual = sha256Hex(tarballBuf);
  if (actual !== expected) {
    throw err('IntegrityCheckFailed', `expected sha256 ${expected}, got ${actual} for ${tarballName}.`);
  }

  // Extract with tar
  fs.mkdirSync(cacheDir, { recursive: true });
  const tarPath = path.join(cacheDir, tarballName);
  fs.writeFileSync(tarPath, tarballBuf);

  const tarResult = spawnSync('tar', ['-xzf', tarPath, '-C', cacheDir, 'cyoda'], { encoding: 'utf8' });
  if (tarResult.status !== 0) {
    throw err('BinaryExecutionFailed', `tar extraction failed: ${tarResult.stderr || tarResult.error}`);
  }
  fs.rmSync(tarPath);

  // Make executable
  fs.chmodSync(binaryPath, 0o755);
  return binaryPath;
}

function runBinaryCommand(binaryPath, args) {
  const result = spawnSync(binaryPath, args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, timeout: 30000 });
  if (result.status !== 0 || result.error) {
    throw err('BinaryExecutionFailed', `"${binaryPath} ${args.join(' ')}" exited ${result.status}: ${result.stderr || result.error?.message || '(no stderr)'}`);
  }
  return result.stdout;
}

/**
 * Main fetcher entry point.
 * @param {object} opts
 * @param {typeof globalThis.fetch} opts.fetch
 * @param {string} opts.versionFilePath
 * @param {string} opts.outputJsonPath
 * @param {string} opts.outputYamlPath
 * @param {string} opts.cacheDir
 * @param {boolean} [opts.ifMissing]
 * @param {{platform: string, arch: string}} [opts.platformHint]
 */
export async function run({ fetch: fetchFn, versionFilePath, outputJsonPath, outputYamlPath, cacheDir, ifMissing, platformHint }) {
  if (ifMissing && fs.existsSync(outputJsonPath) && fs.existsSync(outputYamlPath)) {
    return;
  }

  const version = parsePinFile(versionFilePath);
  console.log(`📘 Fetching cyoda OpenAPI spec (pinned v${version})...`);

  const platformSrc = platformHint || { platform: process.platform, arch: process.arch };
  const platformInfo = detectPlatform(platformSrc);

  const versionCacheDir = path.join(cacheDir, `v${version}`);
  const binaryPath = await ensureBinary({ fetchFn, version, cacheDir: versionCacheDir, platformInfo });

  // Run: cyoda help openapi json
  const jsonOutput = runBinaryCommand(binaryPath, ['help', 'openapi', 'json']);
  let parsed;
  try {
    parsed = JSON.parse(jsonOutput);
  } catch (cause) {
    throw err('BinaryExecutionFailed', `"cyoda help openapi json" produced invalid JSON: ${cause.message}`);
  }
  if (!parsed || typeof parsed.components !== 'object') {
    throw err('BinaryExecutionFailed', `"cyoda help openapi json" output is missing expected "components" key.`);
  }

  // Run: cyoda help openapi yaml
  const yamlOutput = runBinaryCommand(binaryPath, ['help', 'openapi', 'yaml']);

  // Write outputs
  fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
  fs.mkdirSync(path.dirname(outputYamlPath), { recursive: true });

  fs.writeFileSync(outputJsonPath, jsonOutput);
  fs.writeFileSync(outputYamlPath, yamlOutput);

  const jsonKB = Math.round(Buffer.byteLength(jsonOutput, 'utf8') / 1024);
  const yamlKB = Math.round(Buffer.byteLength(yamlOutput, 'utf8') / 1024);
  console.log(`  wrote ${outputJsonPath} (${jsonKB} KB)`);
  console.log(`  wrote ${outputYamlPath} (${yamlKB} KB)`);
}

// CLI entry point
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (invokedDirectly) {
  const projectRoot = path.resolve(__dirname, '..');
  const versionFilePath = path.join(projectRoot, 'cyoda-go-version.json');
  const outputJsonPath = path.join(projectRoot, 'public', 'openapi', 'openapi.json');
  const outputYamlPath = path.join(projectRoot, 'public', 'openapi', 'openapi.yaml');
  const cacheDir = path.join(projectRoot, '.cyoda-cache');
  const ifMissing = process.argv.includes('--if-missing');
  try {
    await run({ fetch: globalThis.fetch, versionFilePath, outputJsonPath, outputYamlPath, cacheDir, ifMissing });
  } catch (e) {
    console.error(`\n❌ ${e.message}`);
    process.exit(1);
  }
}

import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);
const repositoryRoot = process.cwd();
const manifestPath = path.join(repositoryRoot, "module.json");
const distributionPath = path.join(repositoryRoot, "dist");
const packagePath = path.join(distributionPath, "package");
const archivePath = path.join(distributionPath, "emberwolf-quest-manager.zip");
const repository = process.env.GITHUB_REPOSITORY;
const tag = process.env.GITHUB_REF_NAME;
const commit = process.env.GITHUB_SHA;

function fail(message) {
  throw new Error(`Release preparation failed: ${message}`);
}

if (!repository || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
  fail("GITHUB_REPOSITORY must be set to owner/repository.");
}
if (!tag) fail("GITHUB_REF_NAME must contain the release tag.");
if (!commit) fail("GITHUB_SHA must identify the tagged commit.");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const versionMatch = /^(0|1)\.(0|[1-9]\d*)\.(0|[1-9]\d*)\.(\d{3})$/.exec(tag);
if (!versionMatch || versionMatch[4] === "000") {
  fail(`Tag '${tag}' must use R.M.m.b with R equal to 0 or 1 and a nonzero three-digit build.`);
}
if (manifest.id !== "emberwolf-quest-manager") {
  fail(`Unexpected module id '${manifest.id}'.`);
}
if (manifest.version !== tag) {
  fail(`Tag '${tag}' does not match module.json version '${manifest.version}'.`);
}

const manifestUrl = `https://raw.githubusercontent.com/${repository}/main/module.json`;
const archiveUrl = `https://github.com/${repository}/releases/download/${tag}/emberwolf-quest-manager.zip`;
if (manifest.manifest !== manifestUrl) {
  fail(`module.json manifest must be '${manifestUrl}'.`);
}
if (manifest.download !== archiveUrl) {
  fail(`module.json download must be '${archiveUrl}'.`);
}

try {
  await execFileAsync("git", ["merge-base", "--is-ancestor", commit, "origin/main"]);
} catch {
  fail("The tagged commit must be merged into main before publishing.");
}

const { stdout: mainManifestJson } = await execFileAsync("git", ["show", "origin/main:module.json"]);
const mainManifest = JSON.parse(mainManifestJson);
if (mainManifest.version !== tag) {
  fail(`main currently advertises '${mainManifest.version}', not tagged version '${tag}'. Publish versions in order.`);
}

await rm(packagePath, { recursive: true, force: true });
await rm(archivePath, { force: true });
await mkdir(packagePath, { recursive: true });
await cp(manifestPath, path.join(packagePath, "module.json"));
await cp(path.join(repositoryRoot, "scripts"), path.join(packagePath, "scripts"), { recursive: true });
await cp(path.join(repositoryRoot, "README.md"), path.join(packagePath, "README.md"));
await cp(path.join(repositoryRoot, "LICENSE"), path.join(packagePath, "LICENSE"));
await cp(manifestPath, path.join(distributionPath, "module.json"));
await execFileAsync("zip", ["-X", "-q", "-r", archivePath, "."], { cwd: packagePath });

console.log(`Prepared ${archivePath} for ${tag}.`);

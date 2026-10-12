# Versioning and releases

EWQM versions use four dot-separated numeric components: `R.M.m.b`.

- `R` is the release phase: `0` during development and `1` for a full release.
- `M` is the major line; `m` is the minor feature line.
- `b` is a three-digit build number beginning at `001`.
- Increment `b` for each package release. Reset it to `001` when `M` increases. Changing `m` or `R` alone does not reset the build.
- The initial framework version is `0.1.0.001`.

## Publishing a version

1. Set `version` in `module.json` to the next `R.M.m.b` value and set `download` to the matching GitHub release ZIP URL.
2. Merge that versioned change to `main` through a pull request.
3. The push to `main` automatically runs the GitHub Actions release workflow. It validates the version increase and manifest URL, creates the matching tag and GitHub release, packages only the module files, and publishes `module.json` plus `emberwolf-quest-manager.zip`. `R=0` releases are GitHub prereleases; `R=1` releases are full releases.

Foundry's stable manifest URL is the raw `module.json` on `main`. It can therefore advertise development prereleases as well as full releases. The manifest's `download` URL is version-specific, so every advertised version maps to its own release ZIP. Foundry can install or check for updates from this manifest URL after the merge-triggered release workflow has published its assets.

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
3. Create and push a tag whose name exactly matches `module.json`, for example `0.1.0.001`.
4. The GitHub Actions release workflow validates the tag, manifest version, and download URL; packages only the module files; and publishes `module.json` plus `emberwolf-quest-manager.zip` as release assets. `R=0` tags are GitHub prereleases; `R=1` tags are full releases.

Foundry's stable manifest URL is the raw `module.json` on `main`. It can therefore advertise development prereleases as well as full releases. The manifest's `download` URL is version-specific, so every advertised version maps to its own release ZIP. Foundry can install or check for updates from this manifest URL after the matching tag workflow has published its assets.

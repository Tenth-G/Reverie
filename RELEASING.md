# Release Process

Reverie uses signed Tauri updater artifacts published through GitHub Releases.

## One-time setup

The updater public key is committed in `src-tauri/tauri.conf.json`. Keep the
matching private key outside the repository and add it to the GitHub repository
as the `TAURI_SIGNING_PRIVATE_KEY` secret. The current development machine stores
the key at `~/.tauri/reverie.key`.

The generated key has no password. Set
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD` to an empty repository secret, or remove the
password environment variable from the workflow.

## Publish a version

1. Update the version in `package.json`, `src-tauri/Cargo.toml`, and
   `src-tauri/tauri.conf.json`.
2. Run `npm install` so `package-lock.json` reflects the version.
3. Run `npm run check` and `npm test`.
4. Commit the version change and create a matching tag such as `v1.1.0`.
5. Push the commit and tag. The Release workflow creates a draft GitHub Release
   containing the installer, updater archive, signatures, and `latest.json`.
6. Review the draft artifacts and publish the release.

Never commit the updater private key. Losing it prevents existing installations
from accepting future automatic updates.

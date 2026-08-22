# Release Process

Reverie publishes Windows installers and signed Tauri updater artifacts through
GitHub Releases. Automatic update metadata is read from the configured GitHub
Releases endpoint.

The updater signature is required by Tauri for secure in-app installation. It
is separate from Windows Authenticode signing: the installer itself does not
need a code-signing certificate. Keep the private updater key outside the
repository and configure it as the `TAURI_SIGNING_PRIVATE_KEY` GitHub secret.

## Publish a version

1. Update the version in `package.json`, `src-tauri/Cargo.toml`, and
   `src-tauri/tauri.conf.json`.
2. Run `npm install` so `package-lock.json` reflects the version.
3. Run `npm run check` and `npm test`.
4. Commit the version change and create a matching tag such as `v1.1.0`.
5. Push the commit and tag. The Release workflow creates a draft GitHub Release
   containing the installer, updater archive, signature, and `latest.json`.
6. Review the draft artifacts and publish the release.

# GenXYZ Lab GitHub Releases runbook

## Production architecture

```text
Visitor -> Cloudflare Pages website -> downloads.genxyzlab.org
        -> Cloudflare Worker -> latest stable GitHub Release asset

Installed app -> genxyzlab.org/version.json Pages Function
              -> downloads.genxyzlab.org/version.json
              -> latest stable GitHub Release metadata
```

The website repository contains the Vue site and Worker source. The separate
public `GenXYZ-Lab-Releases` repository contains no private application source;
it is only the public release channel. APKs, ZIPs, and checksums belong in
GitHub **Release assets**, never in either repository's Git history.

## One-time setup

1. Create a **public** GitHub repository named `GenXYZ-Lab-Releases` under
   `LoudyMiguel`. Initialize it with a README. A private repository cannot serve
   anonymous direct downloads through this redirect-only design.
2. Enable GitHub 2FA, store recovery codes offline, and add a passkey or
   hardware security key as a second recovery method.
3. Give release write/admin permission only to accounts that actually publish.
   Protect `main` and `v*` tags from force-push and deletion. Enable immutable
   releases if available in the repository settings.
4. Never add the Flutter source, keystore, `android/key.properties`, passwords,
   private keys, `build/debug-info`, or service-account files to this public
   repository.
5. From `website/download-worker`, run `npx wrangler deploy`. For a public
   repository the Worker works without a GitHub token. For higher API limits,
   create a fine-grained read-only token scoped only to the release repository
   and store it with `npx wrangler secret put GITHUB_TOKEN`; never put it in
   `wrangler.jsonc` or a `VITE_*` variable.
6. In Cloudflare, open **Workers & Pages -> genxyz-downloads -> Settings ->
   Domains & Routes -> Add -> Custom Domain** and add
   `downloads.genxyzlab.org`. Cloudflare creates DNS and TLS automatically. Do
   not create a separate CNAME for that hostname.
7. Do not deploy the website URL switch until a candidate release and both
   Worker download paths pass the tests below.

## Release terminology

- **Repository:** the GitHub container for settings, access, tags, and releases.
- **Tag:** a version label such as `v2.2.0` attached to a Git commit.
- **Release:** the published version page based on a tag, with notes and files.
- **Release asset:** a manually uploaded APK, ZIP, or checksum file.
- **Pre-release:** a beta/test release that must not become the stable latest.
- **Latest:** GitHub's selected stable release. The Worker resolves this release.

Use semantic versions: `v2.2.0` for a compatible feature release, `v2.2.1` for
a hotfix, and `v3.0.0` for a breaking release. Use tags such as
`v2.3.0-beta.1` and the **pre-release** checkbox for public tests.

## Asset naming contract

Every stable release must contain these exact, case-sensitive names:

```text
GenXYZ-Lab.apk
GenXYZ-Lab-Windows.zip
SHA256SUMS.txt
```

The tag supplies the version. Do not use `GenXYZ-Lab-v2.2.0.apk` as the
uploaded asset name: GitHub's `/releases/latest/download/<name>` convention and
the Worker both require the same name to exist in every stable release. The
Windows ZIP may contain a versioned top-level folder even though the ZIP asset
name stays stable.

## Build Android

Update `pubspec.yaml` first. The public version and Android build number must
both be correct, and the build number must be higher than every distributed
build:

```yaml
version: 2.2.0+6
```

Build from the Flutter project root with the existing release signing key:

```powershell
cd "C:\flutter project\quizy"
$releaseVersion = "2.2.0"

flutter analyze
flutter test

flutter build apk --release --split-per-abi `
  --obfuscate `
  --split-debug-info="build\debug-info\android-$releaseVersion" `
  --dart-define="DRIVE_CATALOG_URL=https://drive.google.com/drive/folders/1yNocz5yIk0bFbiP1UxHO4TfBRvSi6ofz?usp=drive_link" `
  --dart-define="TEMPLATE_CATALOG_URL=https://drive.google.com/drive/folders/1DmQCO_4Tfxb3263QBWxxchTfFthZlg56?usp=sharing" `
  --dart-define="GOOGLE_OAUTH_CLIENT_ID=1006856056001-ts667c1buq4sdhs429fbqn7osust7l53.apps.googleusercontent.com" `
  --dart-define="GOOGLE_CLOUD_PROJECT_ID=qc-scholar-504213" `
  --dart-define="ENABLE_TESTING_MODE_QUIZ_BYPASS=false"

New-Item -ItemType Directory -Force "build\release-upload" | Out-Null
Copy-Item -LiteralPath "build\app\outputs\flutter-apk\app-arm64-v8a-release.apk" `
  -Destination "build\release-upload\GenXYZ-Lab.apk" -Force
```

`--split-per-abi` creates three files. The current website advertises ARM64, so
publish only `app-arm64-v8a-release.apk` under the stable name above. Publish a
universal APK or separate routes later if older 32-bit devices become a product
requirement.

Verify the final APK is signed, then install it over the previous public build
on a real ARM64 Android device. The application ID and signing certificate must
remain unchanged, and the new version code must be higher.

```powershell
apksigner verify --verbose --print-certs "build\release-upload\GenXYZ-Lab.apk"
adb install -r "build\release-upload\GenXYZ-Lab.apk"
```

Keep the keystore and `android/key.properties` outside GitHub, with encrypted
offline backups. GitHub Releases stores the already-signed file; it does not
sign or modify an APK.

## Build Windows

```powershell
cd "C:\flutter project\quizy"
$releaseVersion = "2.2.0"

flutter build windows --release `
  --obfuscate `
  --split-debug-info="build\debug-info\windows-$releaseVersion" `
  --dart-define="DRIVE_CATALOG_URL=https://drive.google.com/drive/folders/1yNocz5yIk0bFbiP1UxHO4TfBRvSi6ofz?usp=drive_link" `
  --dart-define="TEMPLATE_CATALOG_URL=https://drive.google.com/drive/folders/1DmQCO_4Tfxb3263QBWxxchTfFthZlg56?usp=sharing" `
  --dart-define="GOOGLE_OAUTH_CLIENT_ID=1006856056001-ts667c1buq4sdhs429fbqn7osust7l53.apps.googleusercontent.com" `
  --dart-define="GOOGLE_CLOUD_PROJECT_ID=qc-scholar-504213" `
  --dart-define="ENABLE_TESTING_MODE_QUIZ_BYPASS=false"

$source = "build\windows\x64\runner\Release"
$staging = "build\release-upload\GenXYZ-Lab-v$releaseVersion"
New-Item -ItemType Directory -Force $staging | Out-Null
Copy-Item -Path "$source\*" -Destination $staging -Recurse -Force
Compress-Archive -Path $staging `
  -DestinationPath "build\release-upload\GenXYZ-Lab-Windows.zip" -Force
```

Extract the ZIP to a different directory and start the app from that extracted
copy. The EXE, DLLs, and `data` directory must stay together. If you have a
trusted Authenticode certificate, sign the executable before creating the ZIP.
GitHub hosting does not remove Windows SmartScreen warnings or create publisher
reputation; checksums prove file equality, while code signing proves publisher
identity.

## Generate checksums

Run this only after both final filenames exist:

```powershell
cd "C:\flutter project\quizy\build\release-upload"
$releaseFiles = Get-Item "GenXYZ-Lab.apk", "GenXYZ-Lab-Windows.zip"
$checksumLines = foreach ($file in $releaseFiles) {
  $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  "$hash  $($file.Name)"
}
$checksumLines | Set-Content -Encoding ascii "SHA256SUMS.txt"
Get-Content "SHA256SUMS.txt"
```

Publish `SHA256SUMS.txt` with every release. Windows users can compare with
`Get-FileHash`; Android/Termux users can use `sha256sum`. A checksum detects a
changed or incomplete file, while the APK/Authenticode signatures provide the
stronger publisher identity.

## Publish the GitHub Release

1. Open `https://github.com/LoudyMiguel/GenXYZ-Lab-Releases/releases/new`.
2. Choose **Create new tag**, enter the exact version such as `v2.2.0`, and
   target `main`.
3. Set the title to `GenXYZ Lab 2.2.0` and write useful release notes.
4. Upload `GenXYZ-Lab.apk`, `GenXYZ-Lab-Windows.zip`, and `SHA256SUMS.txt`.
5. Confirm both binaries have nonzero sizes and the filenames match exactly.
6. Leave **Set as a pre-release** unchecked for a stable build.
7. Select **Set as the latest release** and publish.

One release should contain both platforms so `/latest` moves atomically. GitHub
also creates automatic source-code ZIP/TAR links; those are not the Windows
application and should not be linked from the website.

Direct GitHub latest-asset URLs are:

```text
https://github.com/LoudyMiguel/GenXYZ-Lab-Releases/releases/latest/download/GenXYZ-Lab.apk
https://github.com/LoudyMiguel/GenXYZ-Lab-Releases/releases/latest/download/GenXYZ-Lab-Windows.zip
```

The Worker resolves GitHub's latest stable release, verifies the exact asset is
present, and returns HTTP `307 Temporary Redirect`. A temporary redirect is
intentional because the destination changes with each release; permanent 301
or 308 responses could leave users stuck on an old cached asset. The Worker
does not proxy the large files, so GitHub—not Cloudflare Worker memory—is the
binary data path.

## Test before switching the website

Keep the old Google Drive files private-link accessible as a temporary rollback
copy. Do not delete them during migration.

1. Test both direct GitHub URLs in a signed-out browser.
2. Deploy the Worker and attach its custom domain.
3. Open `https://downloads.genxyzlab.org/health`; confirm the release tag and
   both `available` fields.
4. Test both stable Worker URLs on desktop, Android Chrome, private browsing,
   and another network.
5. Confirm HTTPS, the 307 response, final filenames, sizes, and SHA-256 values.
6. Install Android over the old version and test a clean install.
7. Extract the Windows ZIP elsewhere and test application startup.
8. Only now commit and deploy the website URL switch.
9. Verify `https://genxyzlab.org/version.json` returns the GitHub release
   version and the two stable Worker URLs.
10. Monitor Worker logs, GitHub asset downloads, site clicks, and user reports
    for at least one full release cycle before removing the Drive backup.

## Failure and rollback

- A missing asset, GitHub API error, private repository, or invalid release URL
  returns a branded `503` response with `Retry-After: 60` instead of a raw
  exception. Unknown paths return 404 and unsupported methods return 405.
- Release metadata is cached at Cloudflare for 60 seconds. This reduces GitHub
  API calls, but a newly published release or rollback can take up to one minute
  to appear in a given Cloudflare location.
- If `v2.2.0` is broken, mark the prior known-good release as **Latest**. The
  stable URLs recover without a website change. Then publish a corrected higher
  patch version, such as `v2.2.1`.
- Do not silently replace an immutable release asset. A new tag and release
  preserve the audit trail and ensure Android receives a higher build number.
- If GitHub itself is unavailable, keep the branded error rather than silently
  serving an unverified Drive file. The retained Drive copy is an operator
  recovery source, not an automatic user fallback.

## Normal future release

After the one-time migration, a normal stable release is only:

1. Build and test the signed APK.
2. Build, package, and test the Windows ZIP.
3. Generate `SHA256SUMS.txt`.
4. Create the new stable GitHub Release with the three exact asset names.
5. Mark it latest and publish.

No website change, Pages rebuild, Worker change, DNS change, or Google Drive
upload is required.

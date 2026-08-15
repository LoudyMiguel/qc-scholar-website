# GenXYZ Lab release runbook (Android APK + Windows)

This document describes the complete release process for publishing a new GenXYZ Lab Android APK and updating the public download button on the GenXYZ Lab website.

It covers:

- Flutter and Android version numbering
- Release signing and update compatibility
- Building and testing the APK, with R8 shrinking + Dart obfuscation enabled
- Uploading a versioned APK to Cloudflare R2
- Updating Cloudflare Pages release variables
- Keeping public/version.json in sync so the in-app update checker works
- Production validation and rollback

The APK must never be committed to this website repository. The website repository contains only the landing page and deployment configuration.

## Current release architecture

```text
Flutter source
  C:\flutter project\quizy

Website source
  C:\flutter project\quizy\website

Android version source
  C:\flutter project\quizy\pubspec.yaml

Release APK output
  C:\flutter project\quizy\build\app\outputs\flutter-apk\app-release.apk

R2 bucket
  qc-scholar-releases

R2 object prefix
  releases/

Current public R2 development hostname
  https://pub-16c29a592e56470b9f52d21fec59f97b.r2.dev
```

The R2 development hostname can be replaced later with a custom download domain. Do not change the release procedure when that happens; only replace the public base URL.

## Version-number rules

The Flutter version is defined in the root `pubspec.yaml`:

```yaml
version: 1.0.0+1
```

The two parts have different purposes:

| Part | Android field | Purpose |
| --- | --- | --- |
| `1.0.0` | `versionName` | User-visible release version |
| `1` | `versionCode` | Internal positive integer used to order Android updates |

Every published build must have a `versionCode` greater than every previously distributed build. Never reuse or decrease it.

Suggested version changes:

```text
Bug fix:                 1.0.0+1 -> 1.0.1+2
Backward-compatible feature: 1.0.0+1 -> 1.1.0+2
Breaking/major release:  1.0.0+1 -> 2.0.0+2
Rebuild of same version: 1.1.0+2 -> 1.1.0+3
```

The build number still increases when the user-visible version stays the same.

## Critical update-compatibility rules

An APK can update an installed GenXYZ Lab app only when all of the following remain compatible:

1. The new `versionCode` is higher.
2. The Android `applicationId` is unchanged.
3. The new APK is signed with the same release certificate.
4. The device meets the new minimum Android SDK requirements.

This project currently uses:

```text
applicationId: com.example.quizy
release signing properties: android/key.properties
```

Do not change the `applicationId` after users have installed the app. Do not generate a different signing key for a routine update. Back up the release keystore and `key.properties` credentials securely outside Git; losing the signing identity can prevent future updates.

Never commit any of these files or values:

- Release keystore files
- `android/key.properties`
- Keystore passwords
- R2 API tokens
- Firebase service-account keys

## Step 1: choose and record the next version

Before editing anything, decide:

```text
Version name: 1.1.0
Build number: 2
Release date: YYYY-MM-DD
Release summary: Short description of the important changes
```

Check the latest distributed APK or release record. Do not rely only on an old local build directory when choosing the build number.

## Step 2: update `pubspec.yaml`

Open the Flutter project version file:

```powershell
notepad "C:\flutter project\quizy\pubspec.yaml"
```

For a `1.1.0` release with build number `2`, change:

```yaml
version: 1.0.0+1
```

to:

```yaml
version: 1.1.0+2
```

Do not manually duplicate the version in `android/app/build.gradle.kts`. The Android Gradle configuration already reads `flutter.versionName` and `flutter.versionCode` from Flutter.

## Step 3: run pre-release validation

From the Flutter project root:

```powershell
cd "C:\flutter project\quizy"

flutter doctor
flutter pub get
flutter analyze
flutter test
```

Resolve release-blocking analyzer errors and failed tests before building. Review all functionality affected by the release, especially:

- App startup
- Existing local-data migrations
- Termux integration
- Compiler Manager workflows
- File/storage permissions
- Downloads and network access
- Any minimum or target SDK changes

**R8 code shrinking is enabled on the Android release build**
(`android/app/build.gradle.kts`, `isMinifyEnabled`/`isShrinkResources`), with
hand-written keep rules in `android/app/proguard-rules.pro` for the plugins
known to need them. Those rules were verified against each plugin's real
Android package name, but never against actual runtime behavior — nothing in
this repo can run R8-shrunk code on a device. **The first release built after
minification was turned on needs a full manual pass on a real device, not
just the update-path check above** — specifically: local notifications (the
server/tunnel ongoing notification), QR scanning (course import, certificate
verification), the in-app WebView (media player, Web Playground), any stored
AI provider key surviving a restart, Arduino Studio's USB device list, and
voice dictation. A plugin broken by over-aggressive shrinking fails silently
at runtime, not at build time — there's no compiler error to catch it here.

`flutter clean` is not required for every release. Use it when build output appears stale or after native Gradle/plugin changes:

```powershell
flutter clean
flutter pub get
```

## Step 4: build the signed release APK

Build from the Flutter project root, WITH Dart obfuscation:

```powershell
cd "C:\flutter project\quizy"
$releaseVersion = "1.1.0"   # match Step 1's chosen version

flutter build apk --release `
  --obfuscate `
  --split-debug-info="build\debug-symbols\$releaseVersion" `
  --dart-define=DRIVE_API_KEY=YOUR_KEY `
  --dart-define=SERVER_BASE_URL=YOUR_SERVER
```

Expected output:

```text
C:\flutter project\quizy\build\app\outputs\flutter-apk\app-release.apk
```

The release build must use the existing signing configuration from `android/key.properties`. Treat a missing signing file, missing keystore, or changed certificate as a release blocker.

### About `--obfuscate --split-debug-info`

`--obfuscate` renames Dart class/method/field symbols in the compiled AOT
snapshot (`libapp.so`) — this is the layer R8 (above) cannot touch, since R8
only processes JVM bytecode and the actual application logic (courses,
grading, the AI orchestrator, everything under `lib/`) compiles straight to
native code, not Java/Kotlin. Skipping this flag leaves the entire Dart
codebase's real class and method names readable in the shipped binary
regardless of what R8 does on the Android side.

**`--split-debug-info` writes the symbol map used to de-obfuscate a crash
stack trace back into readable Dart — this directory is exactly as sensitive
as source code and must NEVER be committed, uploaded to R2, or bundled into
any release artifact.** `build\` is already outside anything the website or
R2 upload steps touch, so the path above is safe by construction, but the
habit matters more than the specific path: keep every release's symbol map
(e.g. in a private backup location, one folder per version) or a future crash
report is permanently unreadable, and never let it travel anywhere near a
public download.

**One honest limit worth knowing:** obfuscation renames symbols, not string
literals. `--dart-define` values like `DRIVE_API_KEY` and `SERVER_BASE_URL`
are embedded as plain Dart string constants and remain fully readable by
anyone who runs `strings` on the binary — obfuscation was never going to hide
those regardless. That key is meant to be restricted by Google's API console
(package name + signing certificate), not kept secret client-side; the actual
secrets (AI provider keys, OAuth tokens) never reach a `--dart-define` at all —
they live only in `flutter_secure_storage` at runtime, entered by the student.

## Step 5: create a versioned release artifact

Do not distribute a generic `app-release.apk` filename. Copy it to a versioned filename:

```powershell
$releaseVersion = "1.1.0"
$sourceApk = "C:\flutter project\quizy\build\app\outputs\flutter-apk\app-release.apk"
$releaseApk = "C:\flutter project\quizy\build\app\outputs\flutter-apk\qc-scholar-v$releaseVersion.apk"

Copy-Item -LiteralPath $sourceApk -Destination $releaseApk
```

Calculate the size and SHA-256 checksum:

```powershell
$releaseFile = Get-Item -LiteralPath $releaseApk

Get-FileHash -LiteralPath $releaseFile.FullName -Algorithm SHA256
"{0:N1} MB" -f ($releaseFile.Length / 1MB)
```

Record both values in the release notes. The checksum lets you verify that the uploaded APK is the artifact you tested.

## Step 6: test the actual Android update path

Testing a fresh installation is not enough. Install the previous public version on a test device, then install the new version without uninstalling the previous version.

With Android Debug Bridge:

```powershell
adb devices
adb install -r "C:\flutter project\quizy\build\app\outputs\flutter-apk\qc-scholar-v1.1.0.apk"
```

Confirm:

- Android recognizes the APK as an update.
- Installation does not report a signature mismatch.
- Existing user data remains available.
- The app reports the correct visible version.
- Previously working courses, projects, settings, and compiler data still work.
- New release functionality works on a clean installation and an update installation.

Common ADB update failures:

| Error | Likely cause | Resolution |
| --- | --- | --- |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | New `versionCode` is not higher | Increment the build number and rebuild |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | APK uses a different signing key or package identity | Restore the original application ID and release signing key |
| `INSTALL_FAILED_OLDER_SDK` | Device is below the configured minimum SDK | Test on a supported device or reconsider the minimum SDK |

Never solve a signing mismatch by telling existing users to uninstall unless losing local app data and breaking the update path is an explicitly accepted outcome.

## Step 7: upload a new object to Cloudflare R2

Every release must use a new object key:

```text
releases/qc-scholar-v1.1.0.apk
```

Do not overwrite an older versioned object. Existing objects use long-lived immutable caching, so reusing a filename can leave users receiving an old APK.

Authenticate Wrangler when needed:

```powershell
npx wrangler login
```

Upload the new APK:

```powershell
npx wrangler r2 object put "qc-scholar-releases/releases/qc-scholar-v1.1.0.apk" `
  --file="C:\flutter project\quizy\build\app\outputs\flutter-apk\qc-scholar-v1.1.0.apk" `
  --content-type="application/vnd.android.package-archive" `
  --content-disposition='attachment; filename="qc-scholar-v1.1.0.apk"' `
  --cache-control="public, max-age=31536000, immutable" `
  --remote
```

The resulting URL for the current public R2 development hostname is:

```text
https://pub-16c29a592e56470b9f52d21fec59f97b.r2.dev/releases/qc-scholar-v1.1.0.apk
```

Alternatively, upload through the Cloudflare dashboard:

```text
Cloudflare dashboard
  -> R2 Object Storage
  -> qc-scholar-releases
  -> releases
  -> Upload
```

Ensure the object keeps its exact versioned filename.

## Step 8: verify the R2 object before updating the website

Check the response headers:

```powershell
$downloadUrl = "https://pub-16c29a592e56470b9f52d21fec59f97b.r2.dev/releases/qc-scholar-v1.1.0.apk"
curl.exe -I $downloadUrl
```

Expected properties:

```text
HTTP 200
Content-Type: application/vnd.android.package-archive
Content-Disposition: attachment; filename=qc-scholar-v1.1.0.apk
Content-Length: a non-zero value matching the local file size
```

Download the object once and compare its checksum with the locally tested artifact when the release is especially important.

Do not update the website link until the new R2 URL returns `200 OK`.

## Step 9: update Cloudflare Pages release variables

Open:

```text
Cloudflare dashboard
  -> Workers & Pages
  -> <your Pages project name>
  -> Settings
  -> Variables and Secrets
```

Update the **Production** environment values:

```text
VITE_SITE_URL=https://your-final-domain.com
VITE_APK_DOWNLOAD_URL=https://pub-16c29a592e56470b9f52d21fec59f97b.r2.dev/releases/qc-scholar-v1.1.0.apk
VITE_APP_VERSION=1.1.0
VITE_APK_SIZE=THE_CALCULATED_SIZE
VITE_RELEASE_DATE=YYYY-MM-DD
VITE_WINDOWS_DOWNLOAD_URL=https://pub-16c29a592e56470b9f52d21fec59f97b.r2.dev/releases/genxyz-lab-v1.1.0-windows.zip
VITE_WINDOWS_SIZE=THE_CALCULATED_SIZE
```

`VITE_SITE_URL` has no per-release meaning but must be correct: the canonical
link, the Open Graph image URL, `robots.txt`, and `sitemap.xml` are all built
from it. A wrong value here makes every shared link preview and every indexed
URL point at the wrong origin.

Leave `VITE_WINDOWS_DOWNLOAD_URL` on its `downloads.example.com` placeholder
until a desktop build is actually uploaded. The site reads that hostname as
"not published yet" and renders Windows as *Coming soon* with a disabled
button, instead of handing visitors a dead link.

Example:

```text
VITE_APK_DOWNLOAD_URL=https://pub-16c29a592e56470b9f52d21fec59f97b.r2.dev/releases/qc-scholar-v1.1.0.apk
VITE_APP_VERSION=1.1.0
VITE_APK_SIZE=81.2 MB
VITE_RELEASE_DATE=2026-09-01
```

In Cloudflare, enter the variable name and value in separate fields. Do not put `NAME=value` in the name field, and do not wrap values in quotation marks.

The website repository does not need a new commit when only these Cloudflare variables change. Vite reads them at build time, so a new Pages deployment is still required.

For matching local development behavior, update the ignored `website/.env.local` file as well:

```env
VITE_APK_DOWNLOAD_URL=https://pub-16c29a592e56470b9f52d21fec59f97b.r2.dev/releases/qc-scholar-v1.1.0.apk
VITE_APP_VERSION=1.1.0
VITE_APK_SIZE=81.2 MB
VITE_RELEASE_DATE=2026-09-01
```

Never commit `.env.local`.

## Step 9b: update `public/version.json` (drives in-app update checks)

**Unlike the Cloudflare variables above, this file needs a real commit and
push — it is not an env var, it's a tracked file the app itself fetches over
the network at `https://<your-domain>/version.json`.**

```json
{
  "android": {
    "version": "1.1.0",
    "url": "https://pub-16c29a592e56470b9f52d21fec59f97b.r2.dev/releases/qc-scholar-v1.1.0.apk",
    "size": "81.2 MB",
    "releaseDate": "2026-09-01",
    "notes": ""
  },
  "windows": {
    "version": "0.0.0",
    "url": "https://downloads.example.com/genxyz-lab-latest-windows.zip",
    "size": "",
    "releaseDate": "",
    "notes": ""
  }
}
```

Every value here should match Step 9's Cloudflare variables exactly — same
version, same URL, same size. `notes` is optional free text shown in the
in-app update banner (e.g. "Fixes offline course sync"); leave it `""` for a
routine release.

**A platform not yet released stays at `"version": "0.0.0"`.** The app treats
that as "nothing to offer" — 0.0.0 never compares as newer than whatever a
user has installed, so it can never trigger an update prompt toward a
placeholder link. Only bump a platform's version here once its real URL from
Step 7 (or the Windows release section) is live and returns `200`.

```bash
cd "C:\flutter project\quizy\website"
# edit public/version.json with the new values
git add public/version.json
git commit -m "Bump version.json for v1.1.0"
git push origin main
```

Cloudflare rebuilds from this push automatically (same as any other commit);
no separate "retry deployment" click is needed for this file specifically.

## Step 10: rebuild Cloudflare Pages

After saving the Production variables:

```text
Cloudflare dashboard
  -> Workers & Pages
  -> <your Pages project name>
  -> Deployments
  -> Latest production deployment
  -> Retry deployment
```

Changing an environment variable without rebuilding does not update a Vite bundle.

Wait until the deployment status is successful. The build should run `npm run build` and publish `dist`. It should not run `npx wrangler deploy`; that command belongs to a Workers deployment rather than the Git-integrated Pages setup used by this site.

## Step 11: perform production release validation

Hard-refresh the live website, then verify:

1. The modal shows the new version.
2. The displayed APK size matches the artifact.
3. The displayed release date is correct.
4. The final confirmation link points to the new versioned R2 URL.
5. The downloaded file has the expected filename.
6. The downloaded file size and checksum match the tested release.
7. The APK installs as an update over the prior release.
8. Firebase download tracking still increments.
9. Comments, reactions, and bug reports still work.
10. The browser console has no CSP, Firebase, or failed-download errors.

Test on an Android device rather than relying only on a desktop browser.

## Windows release

The Windows build is independent of the APK: the website reads it from its own
pair of variables, so it can ship on its own schedule and its absence never
blocks an Android release.

### W1. Build

```powershell
cd "C:\flutter project\quizy"
$releaseVersion = "1.1.0"   # match Step 1's chosen version

flutter config --enable-windows-desktop
flutter clean
flutter pub get
flutter build windows --release `
  --obfuscate `
  --split-debug-info="build\debug-symbols\windows-$releaseVersion" `
  --dart-define=DRIVE_API_KEY=YOUR_KEY `
  --dart-define=SERVER_BASE_URL=YOUR_SERVER
```

Same `--obfuscate`/`--split-debug-info` reasoning as the Android build above —
never commit or ship that symbols folder. **Windows has no R8 equivalent**
(that's an Android/JVM-specific tool), so Dart obfuscation is the only code
hardening layer available on this platform; there is no build-config change
that adds a second one the way `proguard-rules.pro` does for Android.

The output is a **folder**, not a single file:

```text
build\windows\x64\runner\Release\
```

### W2. Package the whole folder

Everything in `Release\` ships together. The `.exe` alone will not start — it
needs the Flutter DLLs and the `data\` directory beside it, and a user who
downloads only the executable gets a missing-DLL dialog with no useful cause.

```powershell
$version = "1.1.0"
$source  = "C:\flutter project\quizy\build\windows\x64\runner\Release"
$zip     = "C:\flutter project\quizy\build\genxyz-lab-v$version-windows.zip"

Compress-Archive -Path "$source\*" -DestinationPath $zip -Force
"{0:N1} MB" -f ((Get-Item $zip).Length / 1MB)
```

### W3. Smoke-test the archive, not the build folder

Extract the zip somewhere else entirely (ideally another machine or a fresh
user profile) and run the executable from there. Testing the original
`Release\` folder proves nothing: it sits inside a tree that already has every
Flutter dependency, so a packaging mistake stays invisible until a visitor
hits it.

### W4. Upload to R2

```powershell
npx wrangler r2 object put "qc-scholar-releases/releases/genxyz-lab-v1.1.0-windows.zip" `
  --file="C:\flutter project\quizy\build\genxyz-lab-v1.1.0-windows.zip" `
  --content-type="application/zip" `
  --content-disposition='attachment; filename="genxyz-lab-v1.1.0-windows.zip"' `
  --remote
```

The bucket keeps its original name on purpose — renaming it would invalidate
every published link for no user-visible gain.

### W5. Point the website at it

Set `VITE_WINDOWS_DOWNLOAD_URL` and `VITE_WINDOWS_SIZE` in Step 9, then
redeploy. Windows switches from *Coming soon* to a live download on the next
build.

### Code signing

The build is unsigned, so SmartScreen shows "Windows protected your PC" on
first run. The download dialog tells users to choose **More info → Run
anyway**, which is honest and works. Removing the warning entirely requires a
paid code-signing certificate (an OV certificate still needs to build
reputation; an EV certificate clears SmartScreen immediately). Treat that as a
separate commercial decision, not a release blocker.

## Rollback procedure

Keep at least the previous known-good APK in R2. Do not delete it immediately after a new release.

If the website points to a broken release:

1. Open Cloudflare Pages Production variables.
2. Restore `VITE_APK_DOWNLOAD_URL` to the previous known-good R2 object.
3. Restore `VITE_APP_VERSION`, `VITE_APK_SIZE`, and `VITE_RELEASE_DATE` to match it.
4. Retry the latest Pages production deployment.
5. Verify the restored download URL.

Important: Android normally refuses a lower `versionCode` over a newer installed build. A website-link rollback helps users who have not installed the bad release. Users who already installed it need a corrected APK with a new, higher build number.

Example:

```text
Broken release:   1.1.0+2
Corrective build: 1.1.0+3 or 1.1.1+3
```

## Download counter behavior

The current Firebase `stats/download_count` value is a global confirmation-click counter. It is not automatically reset for a new version and does not prove that installation completed.

Normally, leave it unchanged so it represents lifetime download-confirmation activity. If per-version counts are required later, change the database design to store counters such as:

```text
stats/downloadsByVersion/1.0.0
stats/downloadsByVersion/1.1.0
```

Do not manually reset the production counter as part of the standard release procedure.

## Troubleshooting

### Website downloads `downloads.example.com`

`VITE_APK_DOWNLOAD_URL` was missing during the Pages build. Add it to the **Production** environment and retry the deployment.

### Website still downloads the previous APK

Check that:

- The Production variable contains the new URL.
- A deployment was started after saving the variable.
- The R2 object key has the new versioned filename.
- The browser was hard-refreshed.

### New R2 URL returns `404`

Check the bucket name, `releases/` prefix, filename spelling, capitalization, and whether Public Development URL access is still enabled.

### APK installs as a separate app

The `applicationId` changed. Restore the original application ID for a compatible update.

### APK reports an incompatible update

Compare the signing certificate and application ID with the previous public APK. Rebuild using the original release keystore.

### APK reports a version downgrade

Increase the build number after `+` in `pubspec.yaml`, rebuild, retest, and upload under the appropriate release filename.

### R2 serves an old file under the same URL

Never replace a long-cached versioned object. Upload a new key and update the website URL.

## Release record template

Keep a private release record for every publication:

```text
GenXYZ Lab release

Version name:
Build number:
Release date:
Application ID:
APK filename:
APK size:
SHA-256:
R2 bucket:
R2 object key:
Public download URL:
Flutter revision/commit:
Signing certificate fingerprint:
Update installation tested on:
Clean installation tested on:
Website deployment ID:
Release summary:
Known issues:
Rollback APK URL:
```

Do not put signing passwords, private keys, Firebase service-account credentials, or Cloudflare tokens in the release record.

## Final release checklist

```text
[ ] Version name selected
[ ] Build number increased
[ ] pubspec.yaml updated
[ ] flutter analyze passed
[ ] flutter test passed
[ ] Signed release APK built WITH --obfuscate --split-debug-info
[ ] Symbol map saved somewhere private (never committed, never uploaded to R2)
[ ] APK renamed with version
[ ] SHA-256 and size recorded
[ ] Update-over-old-version installation passed
[ ] Clean installation passed
[ ] Full feature pass on a real device (required after any proguard-rules.pro
    change — R8 breakage is silent at runtime, not a build error): local
    notification, QR scan, in-app WebView, stored AI key, Arduino USB list,
    voice dictation
[ ] public/version.json bumped, committed, pushed (Step 9b)
[ ] New versioned R2 object uploaded
[ ] R2 URL returns 200
[ ] Cloudflare Production variables updated
[ ] Cloudflare Pages rebuilt successfully
[ ] Website modal shows correct release metadata
[ ] Production download tested on Android
[ ] Firebase functionality verified
[ ] Previous known-good R2 object retained for rollback
```


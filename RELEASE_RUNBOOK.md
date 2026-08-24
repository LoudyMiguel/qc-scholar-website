# GenXYZ Lab release runbook (Android APK + Windows)

This document describes the complete release process for publishing a new GenXYZ Lab Android APK and updating the public download button on the GenXYZ Lab website.

It covers:

- Flutter and Android version numbering
- Release signing and update compatibility
- Building and testing the APK, with R8 shrinking + Dart obfuscation enabled
- Uploading versioned release files to Google Drive
- Updating the tracked release manifest
- Generating `version.json` so the in-app update checker uses the same links
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

Release file hosting
  Google Drive files shared as "Anyone with the link"
```

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
- Google account credentials or private sharing invitations
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
$releaseVersion = "2.1.0"   # match Step 1's chosen version

flutter build apk --release --split-per-abi `
  --obfuscate `
  --split-debug-info="build\debug-info\android-$releaseVersion" `
  --dart-define="DRIVE_CATALOG_URL=https://drive.google.com/drive/folders/1yNocz5yIk0bFbiP1UxHO4TfBRvSi6ofz?usp=drive_link" `
  --dart-define="TEMPLATE_CATALOG_URL=https://drive.google.com/drive/folders/1DmQCO_4Tfxb3263QBWxxchTfFthZlg56?usp=sharing" `
  --dart-define="GOOGLE_OAUTH_CLIENT_ID=1006856056001-ts667c1buq4sdhs429fbqn7osust7l53.apps.googleusercontent.com" `
  --dart-define="GOOGLE_CLOUD_PROJECT_ID=qc-scholar-504213" `
  --dart-define="ENABLE_TESTING_MODE_QUIZ_BYPASS=false"
```

Expected output:

```text
C:\flutter project\quizy\build\app\outputs\flutter-apk\app-arm64-v8a-release.apk
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
as source code and must NEVER be committed, uploaded to Google Drive, or
bundled into any release artifact.** `build\` is already outside anything the
website upload steps touch, so the path above is safe by construction, but the
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
$releaseVersion = "2.1.0"
$sourceApk = "C:\flutter project\quizy\build\app\outputs\flutter-apk\app-arm64-v8a-release.apk"
$releaseApk = "C:\flutter project\quizy\build\app\outputs\flutter-apk\genxyz-lab-v$releaseVersion-arm64.apk"

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

## Step 7: upload the APK to Google Drive

Upload the versioned APK without overwriting the previous release. Choose
**Share**, set General access to **Anyone with the link**, and copy the public
share URL.

```text
qc-scholar-v1.1.0.apk
https://drive.google.com/file/d/YOUR_APK_FILE_ID/view?usp=sharing
```

Keep symbol maps, signing files, and credentials out of the shared folder.

## Step 8: verify the Drive file before updating the website

Open the share URL in a signed-out/private browser window, download the APK,
and verify its size and SHA-256 checksum against the locally tested artifact.
Do not update the website variable until this test succeeds.

## Step 9: update the tracked release manifest

Edit `release-manifest.json` with the tested Google Drive URL, version, size,
release date, and notes for each published platform. This tracked file is
authoritative for the website download buttons and generated `version.json`.
Cloudflare release variables remain optional fallbacks only when a manifest URL
is empty.

Open:

```text
Cloudflare dashboard
  -> Workers & Pages
  -> <your Pages project name>
  -> Settings
  -> Variables and Secrets
```

Keep the **Production** site origin correct:

```text
VITE_SITE_URL=https://genxyzlab.org
```

Share both Drive files as **Anyone with the link** and test the links in a
signed-out/private browser window. The website accepts only Google Drive URLs;
a missing, malformed, or non-Drive value disables that platform's button.

`VITE_SITE_URL` has no per-release meaning but must be correct: the canonical
link, the Open Graph image URL, `robots.txt`, and `sitemap.xml` are all built
from it. A wrong value here makes every shared link preview and every indexed
URL point at the wrong origin.

Leave a platform's manifest URL empty until its artifact is uploaded and tested.
The build then emits version `0.0.0` for that platform and the site renders it
as *Coming soon* with a disabled button.

For testing a URL before recording it in the manifest, the ignored
`website/.env.local` values remain available as optional fallbacks:

```env
VITE_APK_GOOGLE_DRIVE_URL=https://drive.google.com/file/d/YOUR_APK_FILE_ID/view?usp=sharing
VITE_APP_VERSION=1.1.0
VITE_APK_SIZE=81.2 MB
VITE_RELEASE_DATE=2026-09-01
```

Never commit `.env.local`.

## Step 9b: review the generated update manifest

The Pages build generates `version.json` from the tracked
`release-manifest.json`. The installed app fetches it from
`https://<your-domain>/version.json`.

```json
{
  "android": {
    "version": "1.1.0",
    "url": "https://drive.google.com/file/d/YOUR_APK_FILE_ID/view?usp=sharing",
    "size": "81.2 MB",
    "releaseDate": "2026-09-01",
    "notes": ""
  },
  "windows": {
    "version": "0.0.0",
    "url": "",
    "size": "",
    "releaseDate": "",
    "notes": ""
  }
}
```

The generated values match Step 9's tracked manifest. `notes` is optional free
text shown in the update banner.

**A platform not yet released stays at `"version": "0.0.0"`.** The app treats
that as "nothing to offer" — 0.0.0 never compares as newer than whatever a
user has installed, so it can never trigger an update prompt toward a
placeholder link. Only publish a platform's Drive variable once its file has
passed the signed-out download test.

```bash
cd "C:\flutter project\quizy\website"
# edit release-manifest.json only when its metadata changes
git add release-manifest.json
git commit -m "Update release metadata for v1.1.0"
git push origin main
```

Cloudflare rebuilds from this push automatically.

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
4. The final confirmation link points directly to the Google Drive file.
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
$releaseVersion = "2.1.0"   # match Step 1's chosen version

flutter config --enable-windows-desktop
flutter clean
flutter pub get
flutter build windows --release `
  --obfuscate `
  --split-debug-info="build\debug-info\windows-$releaseVersion" `
  --dart-define="DRIVE_CATALOG_URL=https://drive.google.com/drive/folders/1yNocz5yIk0bFbiP1UxHO4TfBRvSi6ofz?usp=drive_link" `
  --dart-define="TEMPLATE_CATALOG_URL=https://drive.google.com/drive/folders/1DmQCO_4Tfxb3263QBWxxchTfFthZlg56?usp=sharing" `
  --dart-define="GOOGLE_OAUTH_CLIENT_ID=1006856056001-ts667c1buq4sdhs429fbqn7osust7l53.apps.googleusercontent.com" `
  --dart-define="GOOGLE_CLOUD_PROJECT_ID=qc-scholar-504213" `
  --dart-define="ENABLE_TESTING_MODE_QUIZ_BYPASS=false"
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

### W4. Upload to Google Drive

Upload the versioned ZIP, share it as **Anyone with the link**, and test the
download from a signed-out/private browser window.

### W5. Point the website at it

Set the Windows `url`, `size`, version, and date in `release-manifest.json`,
then commit and push. Windows switches from *Coming soon* to a live download on
the next build.

### Code signing

The build is unsigned, so SmartScreen shows "Windows protected your PC" on
first run. The download dialog tells users to choose **More info → Run
anyway**, which is honest and works. Removing the warning entirely requires a
paid code-signing certificate (an OV certificate still needs to build
reputation; an EV certificate clears SmartScreen immediately). Treat that as a
separate commercial decision, not a release blocker.

## Rollback procedure

Keep at least the previous known-good APK in Drive. Do not delete it immediately after a new release.

If the website points to a broken release:

1. Restore the previous known-good Drive URL and matching metadata in
   `release-manifest.json`.
2. Commit and push the rollback.
3. Wait for the Pages production deployment.
4. Verify the restored download URL.

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

### Website shows a platform as Coming soon

Its `*_GOOGLE_DRIVE_URL` variable was missing, malformed, or did not use a
Google Drive hostname during the Pages build. Correct the **Production**
variable and retry the deployment.

### Website still downloads the previous APK

Check that:

- The Production variable contains the new URL.
- A deployment was started after saving the variable.
- The Drive share link points to the new versioned file.
- The browser was hard-refreshed.

### Drive asks the visitor to request access

Open the file's Share dialog, set General access to **Anyone with the link**,
then verify it again in a signed-out/private browser window.

### APK installs as a separate app

The `applicationId` changed. Restore the original application ID for a compatible update.

### APK reports an incompatible update

Compare the signing certificate and application ID with the previous public APK. Rebuild using the original release keystore.

### APK reports a version downgrade

Increase the build number after `+` in `pubspec.yaml`, rebuild, retest, and upload under the appropriate release filename.

### Drive link opens the wrong release

Upload each release with a versioned filename and update the Pages variable to
the new file's share URL. Do not rename an old file and reuse its link.

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
Drive filename:
Drive file ID:
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
[ ] Symbol map saved somewhere private (never committed or publicly shared)
[ ] APK renamed with version
[ ] SHA-256 and size recorded
[ ] Update-over-old-version installation passed
[ ] Clean installation passed
[ ] Full feature pass on a real device (required after any proguard-rules.pro
    change — R8 breakage is silent at runtime, not a build error): local
    notification, QR scan, in-app WebView, stored AI key, Arduino USB list,
    voice dictation
[ ] release-manifest.json metadata reviewed (Step 9b)
[ ] New versioned Drive file uploaded and publicly shared
[ ] Drive URL works while signed out
[ ] release-manifest.json contains both tested public Drive URLs and sizes
[ ] Cloudflare Pages rebuilt successfully
[ ] Website modal shows correct release metadata
[ ] Production download tested on Android
[ ] Firebase functionality verified
[ ] Previous known-good Drive file retained for rollback
```

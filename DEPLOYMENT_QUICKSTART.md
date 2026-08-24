# GenXYZ Lab deployment quick start

Use this checklist to publish a new Android APK, Windows ZIP, and website
release. For signing, rollback, troubleshooting, and first-time Cloudflare
setup, see [`RELEASE_RUNBOOK.md`](RELEASE_RUNBOOK.md) and
[`DEPLOYMENT.md`](DEPLOYMENT.md).

## 1. Choose the release version

Edit `C:\flutter project\quizy\pubspec.yaml` before building:

```yaml
version: 2.1.0+5
```

- `2.1.0` is the public version.
- `5` is the Android build number. It must be higher than every published
  build number.
- Use a new build number for every rebuild that may be distributed.

Set the version once in PowerShell for the remaining commands:

```powershell
cd "C:\flutter project\quizy"
$releaseVersion = "2.1.0"
```

## 2. Generate the Windows icon

The Windows application does not use the Android launcher icon automatically.
Confirm `flutter_launcher_icons.yaml` contains:

```yaml
flutter_launcher_icons:
  image_path: "assets/images/app_ic.png"
  android: true
  ios: true
  windows:
    generate: true
    image_path: "assets/images/app_ic.png"
    icon_size: 256
```

Generate the platform icons, then clean so Windows recompiles its icon:

```powershell
flutter pub get
dart run flutter_launcher_icons
flutter clean
flutter pub get
```

## 3. Validate and build

```powershell
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

flutter build windows --release `
  --obfuscate `
  --split-debug-info="build\debug-info\windows-$releaseVersion" `
  --dart-define="DRIVE_CATALOG_URL=https://drive.google.com/drive/folders/1yNocz5yIk0bFbiP1UxHO4TfBRvSi6ofz?usp=drive_link" `
  --dart-define="TEMPLATE_CATALOG_URL=https://drive.google.com/drive/folders/1DmQCO_4Tfxb3263QBWxxchTfFthZlg56?usp=sharing" `
  --dart-define="GOOGLE_OAUTH_CLIENT_ID=1006856056001-ts667c1buq4sdhs429fbqn7osust7l53.apps.googleusercontent.com" `
  --dart-define="GOOGLE_CLOUD_PROJECT_ID=qc-scholar-504213" `
  --dart-define="ENABLE_TESTING_MODE_QUIZ_BYPASS=false"
```

The template URL above is a plain URL, not a Markdown link, and Dart define
names do not contain backslashes. Never publish or commit `build\debug-info`.
`--split-per-abi` creates three APKs; the public website's Android release is
the `app-arm64-v8a-release.apk` artifact named in Step 4.

## 4. Create the release files

```powershell
$sourceApk = "build\app\outputs\flutter-apk\app-arm64-v8a-release.apk"
$releaseApk = "build\app\outputs\flutter-apk\genxyz-lab-v$releaseVersion-arm64.apk"
$windowsSource = "build\windows\x64\runner\Release"
$windowsZip = "build\genxyz-lab-v$releaseVersion-windows.zip"

Copy-Item $sourceApk $releaseApk
Compress-Archive -Path "$windowsSource\*" -DestinationPath $windowsZip -Force

$apkSize = "{0:N1} MB" -f ((Get-Item $releaseApk).Length / 1MB)
$windowsSize = "{0:N1} MB" -f ((Get-Item $windowsZip).Length / 1MB)
$apkSize
$windowsSize

Get-FileHash $releaseApk -Algorithm SHA256
Get-FileHash $windowsZip -Algorithm SHA256
```

Extract the ZIP into a separate directory and run the executable from the
extracted copy. The complete Windows `Release` folder must be in the ZIP; the
executable cannot run by itself.

## 5. Upload both files to Google Drive

Upload the versioned APK and ZIP created in Step 4:

```text
genxyz-lab-v2.1.0-arm64.apk
genxyz-lab-v2.1.0-windows.zip
```

For each file, choose **Share**, set General access to **Anyone with the
link**, and copy the share URL. Test both URLs in a signed-out/private browser
window before changing the website. Keep older versioned files for rollback.

## 6. Update the tracked release manifest

Edit `release-manifest.json` and set each platform's `version`, public Google
Drive `url`, calculated `size`, `releaseDate`, and release `notes`. This tracked
file is the release source of truth, so a stale Cloudflare release variable
cannot silently send users to an older artifact.

## 7. Check Cloudflare Pages variables

Open:

```text
Workers & Pages
-> GenXYZ Lab Pages project
-> Settings
-> Variables and Secrets
-> Production
```

Keep this value set as `plain_text`:

| Name | Value |
| --- | --- |
| `VITE_SITE_URL` | `https://genxyzlab.org` |

Leave the existing `VITE_FIREBASE_*` values unchanged. Every `VITE_*` value is
included in the public browser bundle, so never put passwords, signing keys,
storage credentials, or service-account credentials in one.

## 8. Check and deploy the website

```powershell
cd "C:\flutter project\quizy\website"
npm install
npm run check

git add release-manifest.json DEPLOYMENT_QUICKSTART.md README.md
git commit -m "Publish GenXYZ Lab v2.1.0"
git push origin main
```

A Git push normally starts the Cloudflare Pages deployment. If it does not,
open the latest production deployment in Cloudflare and select **Retry
deployment**. The Pages build command is `npm run build`, the output directory
is `dist`, and the project root directory is `website` when configured from the
parent repository.

## 9. Verify production

- Open `https://genxyzlab.org/version.json` and confirm both versions and URLs.
- Confirm Android and Windows are both available in the download dialog.
- Download both files and compare their sizes and SHA-256 checksums.
- Install the APK over the previous Android version and confirm user data stays.
- Extract the Windows ZIP and launch it; confirm the custom icon is displayed.
- Confirm Firebase comments, reactions, bug reports, and download counters work.
- Keep the previous Drive release files available for rollback.

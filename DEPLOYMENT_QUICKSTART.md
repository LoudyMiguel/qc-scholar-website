# GenXYZ Lab release quick start

The website URLs never change:

- Android: `https://downloads.genxyzlab.org/latest.apk`
- Windows: `https://downloads.genxyzlab.org/latest-windows.zip`

Complete the one-time GitHub repository and Worker setup in
[`RELEASE_RUNBOOK.md`](RELEASE_RUNBOOK.md) before using this checklist.

## Publish a stable release

1. Increase the Flutter version and Android build number in `pubspec.yaml`.
2. Run `flutter analyze` and `flutter test`.
3. Build the signed Android split APK and the Windows Release folder using the
   commands in the runbook.
4. Copy the ARM64 APK to the exact asset name `GenXYZ-Lab.apk`.
5. ZIP the complete Windows Release folder as `GenXYZ-Lab-Windows.zip`.
6. Test the APK update path and test the extracted Windows ZIP.
7. Generate `SHA256SUMS.txt` for both final files.
8. In `LoudyMiguel/GenXYZ-Lab-Releases`, create a draft release with a SemVer
   tag such as `v2.2.0`.
9. Upload all three files and add release notes.
10. Confirm the release is not marked as a pre-release, select **Set as latest
    release**, and publish it.
11. Open `https://downloads.genxyzlab.org/health` and confirm both assets are
    available for the new tag.
12. Test both stable URLs, their checksums, Android installation, and Windows
    startup.

The Worker caches GitHub release metadata for up to 60 seconds. No website
commit, Cloudflare Pages rebuild, Worker edit, or URL change is needed for a
normal release.

## Asset names are an API contract

Every stable release must contain these exact, case-sensitive filenames:

```text
GenXYZ-Lab.apk
GenXYZ-Lab-Windows.zip
SHA256SUMS.txt
```

Put the version in the tag and release title, not in those two binary asset
names. Versioned filenames break GitHub's stable latest-asset pattern and the
Worker's asset lookup.

## Roll back

If a release is broken, mark the prior known-good stable release as **Latest**
in GitHub. The two public URLs recover after the Worker's 60-second cache
expires. Then publish a higher patch version containing the repaired artifacts;
Android will not install a lower build number over a newer installed build.

const env = import.meta.env

export const siteConfig = Object.freeze({
  name: 'QC Scholar',
  tagline: 'Learn. Practice. Build. Get certified.',
  version: env.VITE_APP_VERSION?.trim() || '1.0.0',
  apkSize: env.VITE_APK_SIZE?.trim() || '~100 MB',
  releaseDate: env.VITE_RELEASE_DATE?.trim() || '',
  apkDownloadUrl:
    env.VITE_APK_DOWNLOAD_URL?.trim() ||
    'https://downloads.example.com/qc-scholar-latest.apk',
  termuxUrl: 'https://f-droid.org/en/packages/com.termux/',
  termuxDocsUrl: 'https://github.com/termux/termux-app#installation',
})

export const isPlaceholderDownload = siteConfig.apkDownloadUrl.includes(
  'downloads.example.com',
)


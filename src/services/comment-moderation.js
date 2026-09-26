const blockedTerms = new Set([
  'brainrot',
  'fanum',
  'gyatt',
  'ohio',
  'rizz',
  'sigma',
  'skibidi',
  'asshole',
  'bitch',
  'bullshit',
  'fuck',
  'motherfucker',
  'porn',
  'shit',
])

export function assertCommunityCommentAllowed(message) {
  const filtered = normalizeCommentForComparison(message)
  const words = filtered.match(/[a-z0-9]+/g) || []
  const links = String(message).match(/(?:https?:\/\/|www\.)\S+/gi) || []

  if (links.length > 1) {
    throw new Error('Please include no more than one link per comment.')
  }
  if (/(.)\1{7,}/iu.test(message)) {
    throw new Error('Please remove excessive repeated characters.')
  }
  if (words.some((word) => blockedTerms.has(word))) {
    throw new Error('Please keep community comments useful and respectful.')
  }
  if (
    /\b(?:free\s+money|crypto\s+giveaway|click\s+here|buy\s+followers|promo\s+code)\b/i.test(
      filtered,
    )
  ) {
    throw new Error('That comment looks like promotional spam.')
  }

  if (words.length >= 10 && new Set(words).size / words.length < 0.3) {
    throw new Error('Please avoid repeating the same words.')
  }
}

export function normalizeCommentForComparison(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/3/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/7/g, 't')
}

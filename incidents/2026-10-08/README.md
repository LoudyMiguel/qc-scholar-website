# 8 October 2026: comment flood and fake download-map points

## What happened

All times UTC. Evidence comes from a read-only export of the public data on
9 October 2026.

| Time | Event |
| --- | --- |
| 8 Oct 12:03 | Probe comment "halo bang" (name "halo") |
| 8 Oct 12:11 | Hand-written comment as "Amogus" |
| 8 Oct ~12:12–12:41 | 315 identical comments as "Binary S Mylanguage", about 0.09 s apart |
| 8 Oct 13:07 | Spam test with two links as "Amogus" |
| Unknown | 4,175 fake download-map points |

**Comments.** 321 comments in total, 317 of them posted between 12:00 and
13:00. The old rules allowed one comment per anonymous account every two
minutes. Firebase Anonymous Authentication creates a new account on request, so
a script created a fresh account for every comment. The crypto-spam comment
would have been refused by the comment form's checks, which shows the script
wrote to Firebase directly and never used the website.

**Map.** `stats/download_locations` held 4,176 cells; the day before the
attack it held one.
- 3,778 of them used keys with a random suffix (`n0p0_e68p5_5610`). The old
  rules never checked that a key matched its coordinates, so every write could
  create a new point.
- All of them had a count of 1 and were marked Android.
- They were spread evenly between latitudes −80° and 80°, including about 760
  in Antarctica and the Southern Ocean. No real downloads come from there.
- They were written straight to Firebase rather than through
  `/api/download-origin`, which only ever returns the caller's own location.

The only genuine cell is `n10p5_e123p75` (Philippines, 11 downloads). The 15
legacy 5° regions (108 downloads) were not touched.

**IP addresses.** None were recorded. The browser wrote to Firebase directly,
and neither Firebase nor the site keeps visitor IP addresses. The attacker's
address cannot be recovered from the data.

## Fix

Comments and download counts now go through Pages Functions (`/api/comments`,
`/api/download`). The functions apply per-address and site-wide limits, block
addresses automatically and through `BLOCKED_IPS`, and log offenders with
their IP address. The database rules deny every direct client write to these
paths. See "Abuse protection" in the top-level README.

## Cleanup

Run these from the repository root after the new rules are deployed
(`firebase deploy --only database`), so nothing can be re-added while you
clean.

```bash
# 1. Back up everything first. backup-*.json is git-ignored; keep it private,
#    because it includes bug reports.
firebase database:get / -o backup-2026-10-09.json

# 2. Reset comments to zero, with their reactions and the old rate-limit records.
firebase database:remove /comments -f
firebase database:remove /commentReactions -f
firebase database:remove /commentRateLimits -f

# 3. Replace the map's precise points with the one genuine cell.
firebase database:set /stats/download_locations incidents/2026-10-08/download_locations.json -f
```

Map points have no timestamps; the site never stored them, by design. That
means "the last 24 hours" cannot be selected directly. Step 3 removes every
precise point except the genuine Philippines cell. Every point recorded before
the attack is kept: the 15 legacy regions and that cell, which existed on
7 October. The download counter (`stats/download_count`, 1,360) and the
platform totals were left alone. They moved only about 30 over the period,
which matches normal traffic.

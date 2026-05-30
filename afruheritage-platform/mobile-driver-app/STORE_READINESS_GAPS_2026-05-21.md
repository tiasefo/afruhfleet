# Store Readiness Gaps (2026-05-21)

## Completed
- Android package configured: `com.tiasefo.afruheritagedriver`
- iOS bundle identifier configured: `com.tiasefo.afruheritagedriver`
- iOS encryption declaration configured: `ITSAppUsesNonExemptEncryption=false`
- EAS app version source configured: `remote`
- Google OAuth web client updated and live
- TikTok OAuth client key/secret configured and live
- Social auth buttons visible on production login page
- Android production build finished successfully (AAB)
- Expo health checks passing: `21/21`

## Current Build Status
- Android production: FINISHED
- Android preview: FINISHED
- iOS builds: none currently listed as completed
- iOS production build attempt result: failed in non-interactive mode at Apple credential setup

## Blocking Gaps For Play Store
1. Play Console listing URL
- Missing public Play Store app URL for portal fields.

2. Android signing fingerprints for TikTok
- MD5 app signature digest (release)
- SHA-256 signing certificate fingerprint
- These should be taken from the release signing key used by EAS/Play App Signing.

3. Store metadata completeness
- Final screenshots, short/long descriptions, privacy policy mapping, and category confirmation in Play Console.

## Blocking Gaps For App Store
1. Apple credentials setup requires interactive EAS session
- Non-interactive build cannot complete missing iOS credential setup.
- Run iOS build in interactive mode to finish provisioning and signing.

2. App Store Connect record and URL
- Missing App Store URL (required by TikTok and launch readiness checklist).

3. iOS signing/distribution checks
- Verify provisioning/profile and successful archive upload to App Store Connect.

## Cross-Store Gaps
1. TikTok app review artifact
- Demo video still required for TikTok review submission.

2. Legal and support validation
- Terms and privacy links resolve, but verify legal text is final and consistent with store disclosures.

3. Final release QA pass
- Device QA on Android and iOS physical devices.
- Regression pass for social login (Google, TikTok, Instagram), KYC, tracking, and support ticket flow.

## Next Actions (Recommended Sequence)
1. Run iOS EAS production build now.
2. Retrieve Android MD5 and SHA-256 signing fingerprints from release key context.
3. Create/confirm Play Store and App Store listing URLs.
4. Record and upload TikTok demo video using the provided checklist script.
5. Execute final pre-submit QA matrix on both platforms.

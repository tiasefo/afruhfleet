# TikTok Login Kit Demo Video Checklist

Use this script to record one clean end-to-end review video for TikTok app approval.

## Video Goal
Demonstrate Login Kit with `user.info.basic` on the real domain and callback.

## Required Environment
- Website: https://afruheritage.com/login
- API callback: https://api.afruheritage.com/api/v1/auth/social/tiktok/callback
- TikTok app name: Afrufleet
- Product: Login Kit
- Scope: user.info.basic

## Recording Rules
- Record in a normal browser window with URL bar visible.
- Keep one continuous recording (no cuts if possible).
- Show user interactions clearly (mouse and clicks visible).
- Keep final file in MP4 format under 50 MB.

## Script (2-4 minutes)
1. Show app details page
- Open TikTok Developer portal App Details page.
- Show selected Product `Login Kit` and scope `user.info.basic`.
- Show configured redirect URI exactly.

2. Show live website origin
- Open https://afruheritage.com
- Navigate to login page.
- Confirm social buttons are visible: Google, Instagram, TikTok.

3. Trigger TikTok login
- Click the TikTok button on https://afruheritage.com/login.
- Show browser redirect to TikTok login/authorize pages.
- Ensure URL includes `client_key=awn3pjvanmd66teg` and correct callback URL.

4. Authenticate and authorize
- Log in with TikTok test user.
- Approve requested permission.
- Show redirect back to Afruheritage callback and then login session completion.

5. Show post-login result
- Show user lands in app session (dashboard or authenticated state).
- Show that session is active in Afruheritage UI.

6. Optional negative test (recommended)
- Log out.
- Trigger TikTok login again.
- Cancel consent and show app handles it gracefully.

## Reviewer Notes Template
Paste this into TikTok app review notes:

Afrufleet uses TikTok Login Kit for user authentication on https://afruheritage.com/login. The integration redirects users to TikTok authorization and returns to https://api.afruheritage.com/api/v1/auth/social/tiktok/callback. The app requests only user.info.basic and then creates or links the user account before completing login in the Afruheritage web app.

## Pre-Upload Check
- Video starts before opening website/app.
- URL bar is readable at critical steps.
- Login and callback are both visible.
- No private secrets shown in recording.

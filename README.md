# Nova — updated personal AI project

This version includes the mint/teal Live orb interface, orbiting dots in all three states, Live captions, voice typing, a conversation transcript panel, interruptible spoken replies, selectable device voices, response-style settings, optional user-controlled memory notes, and mobile/desktop layout.

## Important limitations
- This is a web app/PWA, not an App Store app.
- Live speech recognition depends on browser support and microphone permission. On iPhone, use Safari; if recognition is unavailable, use the iPhone keyboard microphone for voice typing.
- The browser speech engine is not full-duplex studio Live audio. Interrupting Nova stops spoken playback when you tap the microphone or end Live; automatic voice barge-in is not guaranteed.
- Images is a placeholder; image generation is not connected.
- Cloudflare account, Workers AI access, and deployment are required for AI replies. Free allowances and availability can change. Check the Cloudflare dashboard before relying on a free tier.
- Chat history and settings are stored in the browser. Messages and enabled memory notes are sent to your Cloudflare Worker for inference.

## Deploy (one-time setup, easiest with a computer)
1. Create/sign in to a Cloudflare account.
2. Install Node.js on a Windows computer.
3. Extract this ZIP.
4. Open a terminal in the extracted `nova-updated` folder.
5. Run `npm install`.
6. Run `npx wrangler login` and approve the browser sign-in.
7. Run `npm run deploy`.
8. Follow the deploy output to get your `https://...workers.dev` address.
9. Open that address in iPhone Safari, tap Share, then Add to Home Screen.

## Local preview
Run `npm run dev` after `npm install`, then open the local address shown in the terminal.

## iPhone install
After deployment, open the Worker URL in Safari (not an in-app browser), tap Share → Add to Home Screen → Add. Nova then appears as an icon on your Home Screen. Internet is required for AI replies.

# Gemini guild-clerk notes

Quest generation can ask Gemini to write a short, player-visible guild-clerk note for each draft. This feature is optional. Without a configured relay, the module uses a built-in note based on the quest category.

## Privacy and key handling

The Foundry module stores only the relay URL in a client-scoped setting on the GM's browser. It does not store a Gemini key. The browser sends the relay only the public quest title, category, urgency, objective, and reward. It never sends GM notes, party character names, encounter estimates, or other generator metadata. Generated text is plain text and is HTML-escaped by the quest board.

Google says to treat Gemini API keys like passwords and recommends a backend proxy because keys in browser code can be extracted. The included relay keeps the key in the relay process environment, binds to loopback, checks the Foundry request origin, and does not log prompts or response text. See Google's [Gemini API key security guidance](https://ai.google.dev/gemini-api/docs/generate-content/api-key).

## Run the local relay

The helper uses Node.js 18 or later and has no third-party dependencies. On the machine running the GM's browser, configure `GEMINI_API_KEY` in that user's environment, then start:

```powershell
node tools/gemini-relay/server.mjs
```

On Windows, add `GEMINI_API_KEY` as a user environment variable in **Environment Variables**; do not put the key in the module, a world setting, or this repository. Open a new terminal after changing it, and start the relay from the repository root. Restrict the key to the Gemini API in Google AI Studio where available.

The helper listens only on `127.0.0.1:30001`. It expects Foundry to be opened at `http://127.0.0.1:30000`. If the Foundry URL differs, set `EWQM_ALLOWED_ORIGIN` to the exact browser origin (scheme, host, and port), then restart the relay. For example, an origin using `localhost` is distinct from one using `127.0.0.1`.

In the GM Quest Board, enter and save this relay URL in the generator panel:

```text
http://127.0.0.1:30001/gemini/clerk-note
```

The module setting is local to that GM browser. Clear it there to return to built-in wording.

## Hosting and model options

The relay defaults to the stable `gemini-3.8-flash` model. Set `GEMINI_MODEL` before starting the helper to choose another supported model. Set `EWQM_RELAY_PORT` to change the local port; update the URL saved in Foundry to match.

For a remote Foundry site or a secure HTTPS origin, use a trusted HTTPS relay that implements the same contract instead of exposing an API key to browser code. It accepts a JSON POST containing `title`, `category`, `urgency`, `objective`, and `reward`, and returns `{ "text": "..." }`. The Foundry module accepts only HTTPS for non-local relay URLs and does not put credentials in the URL.

If the relay is unreachable or Gemini rejects a request, the draft is still created with built-in wording. The draft's private GM notes remind the GM that the relay failed. The GM can edit the clerk note before publishing.

# Configuration guide

> Generated file. Do not edit manually. Run `npm run config` after changing config or presets.

## What this repo expects

This template is driven by one main content file:

- `profile.config.yaml` — profile content, links, modules, signals, and export settings
- `scripts/theme-presets.json` — named color palettes
- `CONFIG.md` — generated reference

## Commands

- `npm run config` — sync YAML, generate browser data, rebuild icon data, regenerate this guide
- `npm run dev` — run config first, then start the local preview server
- `npm run export` — run config, regenerate local export assets, then try to sync the public GIF teaser to the profile repo

`npm install` provisions the Playwright browser locally for this project, and `npm run export` re-checks it automatically if needed.

## GitHub Pages hosting

Yes — the interactive app can be hosted on GitHub Pages.

There is no backend here. The local dev server is only a static preview helper. The actual app is static HTML, CSS, JS, and generated data files.

Recommended setup:

1. run `npm run config`
2. commit the generated files
3. push the repo
4. enable GitHub Pages from `main` / root

If the repo is named `your-github-username.github.io`, the app is served at the root domain. Otherwise it is served under the repo path.

Use `npm run export` separately when you want to refresh the GIF teaser used in your public profile README.

## Quick setup checklist

1. edit `profile.config.yaml`
2. replace placeholder values like `your-github-username`, `Your Name`, and `your-handle`
3. preview locally with `npm run dev`
4. export assets with `npm run export`

## Top-level fields

- `owner` — GitHub username used to find the sibling public profile repo during export
- `name` — visible display name
- `brandKicker` — small label in the header
- `siteTitle` — main profile title
- `footerNote` — footer text
- `themePreset` — one of the preset names listed below
- `teaserGif` — GIF pacing settings
- `crtEffects` — fixed scanlines overlay settings
- `modules` — the main tabs and content entries
- `signals` — compact cards in the bottom-left area
- `links` — compact bottom-right links

## Theme presets

- `vault-green` — Vault Green: Classic phosphor green with the original retro terminal mood.
- `amber-radar` — Amber Radar: Warm amber terminal inspired by old monochrome monitors.
- `arctic-signal` — Arctic Signal: Cold cyan and ice-blue look with a cleaner sci-fi feel.
- `mono-slate` — Mono Slate: Minimal graphite palette with pale neutral highlights.

To change the palette:

1. pick another `themePreset` in `profile.config.yaml`
2. or add a new preset inside `scripts/theme-presets.json`

Direct per-profile color overrides are intentionally disabled to keep theme changes simple and predictable.

## Module shape

Each module needs:

- `id`
- `label`
- `sidebarTitle`
- `items`

Each item can contain:

- `id`
- `label`
- `eyebrow`
- `title`
- `subtitle`
- `tag`
- `core`
- `copy`
- `bullets`
- `href`
- `hrefLabel`
- `handle`
- `icon`

## Links and social icons

For the `links` module, the visual line stays:

`icon - link`

Supported brand icons:

- GitHub
- LinkedIn
- X / Twitter
- Bluesky
- GitLab
- Discord
- YouTube
- Twitch
- Instagram
- Mastodon

Fallback generic icons:

- website
- pages
- readme
- email

## GIF teaser timing

```yaml
teaserGif:
  stepDelayMs: 1400
```

- minimum: `700 ms`
- maximum: `2400 ms`
- first and last frames automatically stay a little longer for readability

If the value goes outside the allowed range, `npm run config` fails with a clear error.

## Scanlines overlay

```yaml
crtEffects:
  enabled: true
  scanlines: true
```

- `enabled` — master switch for the scanlines overlay
- `scanlines` — fixed horizontal lines over the screen

There is no vignette, distortion, or flicker anymore.

## Minimal starter example

```yaml
owner: your-github-username
name: Your Name
brandKicker: Open Source Profile Template
siteTitle: Your Name // Retro Terminal Profile
footerNote: customize this footer in profile.config.yaml
themePreset: arctic-signal
teaserGif:
  stepDelayMs: 1400
crtEffects:
  enabled: true
  scanlines: true
```

## Social link example

```yaml
- id: github
  label: GitHub
  eyebrow: primary link
  title: GitHub
  subtitle: Public code and profile entry point
  tag: LIVE
  core: gh
  href: https://github.com/your-github-username
  hrefLabel: github.com/your-github-username
  handle: "@your-github-username"
  copy: "Point this to the account you want visitors to explore first."
```

## Export outputs

`npm run export` always generates:

- `assets/profile-static.svg`
- `assets/profile-teaser.gif`

After that, the sync step behaves like this:

- if a target profile repo is found, the GIF is copied there
- if no target profile repo is found, export still succeeds and keeps the generated assets locally

## Public profile sync

By default, export looks for a sibling repository named after `owner`.

If needed, override the path:

- macOS/Linux: `PROFILE_REPO_PATH=/absolute/path/to/profile-repo npm run export`
- Windows CMD: `set PROFILE_REPO_PATH=C:\path\to\profile-repo && npm run export`
- PowerShell: `$env:PROFILE_REPO_PATH='C:\path\to\profile-repo'; npm run export`

To intentionally skip the public sync step:

- macOS/Linux: `SKIP_PROFILE_SYNC=1 npm run export`
- Windows CMD: `set SKIP_PROFILE_SYNC=1 && npm run export`

## Corporate TLS issue

If Playwright downloads fail with `SELF_SIGNED_CERT_IN_CHAIN`, your network is likely intercepting TLS.

Recommended Windows fix:

```bat
npm config set cafile "C:\certs\corp-root.pem"
setx NODE_EXTRA_CA_CERTS "C:\certs\corp-root.pem"
node node_modules\playwright\cli.js install chromium
```

## License

MIT. See `LICENSE`.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { profileData } from '../src/profile-data.js';
import { getSocialIcon } from '../src/social-icons.generated.js';

const EXPORT_WIDTH = 1136;
const EXPORT_HEIGHT = 876;
const theme = profileData.theme ?? {};

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const rootDir = path.resolve(__dirname, '..');
        const stylesPath = path.join(rootDir, 'styles.css');
        const assetDir = path.join(rootDir, 'assets');
        const outputPath = path.join(assetDir, 'profile-static.svg');
        const embeddedCss = await readFile(stylesPath, 'utf8');

        const escapeXml = (value) =>
          String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&apos;');

        const toCssVarName = (value) => value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);

        const module = profileData.modules[0];
        const item = module.items[0];

        const renderTabs = () =>
          profileData.modules
            .map(
              (entry, index) =>
                `<div class="tab-button${index === 0 ? ' is-active' : ''}">${escapeXml(entry.label)}</div>`
            )
            .join('');

        const renderSidebarItems = () =>
          module.items
            .map(
              (entry, index) => `
                <div class="item-button${entry.id === item.id ? ' is-active' : ''}">
                  <span>${escapeXml(entry.label)}</span>
                  <span class="item-button__index">${String(index + 1).padStart(2, '0')}</span>
                </div>
              `
            )
            .join('');

const renderBullets = () => item.bullets.map((bullet) => `<li>${escapeXml(bullet)}</li>`).join('');

const formatLinkDisplay = (value) => {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value);
    const formattedPath = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${url.host}${formattedPath}`;
  } catch {
    return String(value).replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
};

const renderSocialIcon = (entry) => {
  const icon = getSocialIcon(entry);

  if (icon.mode === 'stroke') {
    return `
      <svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="${escapeXml(icon.viewBox)}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        ${(icon.paths ?? []).map((pathData) => `<path d="${escapeXml(pathData)}"></path>`).join('')}
      </svg>
    `;
  }

  return `
    <svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="${escapeXml(icon.viewBox)}" aria-hidden="true" fill="currentColor">
      <path d="${escapeXml(icon.path)}"></path>
    </svg>
  `;
};

const renderPanelLinks = () => {
  const displayValue = item.hrefLabel ?? (item.href ? formatLinkDisplay(item.href) : item.handle);
  if (!displayValue) {
    return '';
  }

  return `
    <div class="panel-links">
      <div class="panel-link-line">
        ${renderSocialIcon(item)}
        <strong class="panel-link-value">${escapeXml(displayValue)}</strong>
      </div>
    </div>
  `;
};

        const renderSignals = () =>
          profileData.signals
            .map(
              (signal) => `
                <article class="signal-card">
                  <strong>${escapeXml(signal.value)}</strong>
                  <span>${escapeXml(signal.label)}</span>
                </article>
              `
            )
            .join('');

        const renderLinks = () =>
          profileData.links
            .map(
              (link) =>
                `<div class="link-pill">${renderSocialIcon(link)}<span class="link-pill__meta">${escapeXml(link.hrefLabel ?? formatLinkDisplay(link.href))}</span></div>`
            )
            .join('');

const themeStyle = Object.entries(profileData.theme ?? {})
          .map(([key, value]) => `--${toCssVarName(key)}:${escapeXml(value)}`)
          .join(';');

        const exportCss = `
        ${embeddedCss}
        .page, .page * {
          box-sizing: border-box;
        }

        .page {
          width: ${EXPORT_WIDTH}px;
          height: ${EXPORT_HEIGHT}px;
          color: var(--text);
          font-family: 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace;
        }

        .page .crt {
          display: none;
        }

        .page .shell {
          max-width: none;
          margin: 0;
          padding: 0;
        }

        .page .tab-button,
        .page .item-button,
        .page .link-pill {
          cursor: default;
        }

        .page .link-pill {
          pointer-events: none;
        }
        `;

        const svg = `<svg width="1200" height="940" viewBox="0 0 1200 940" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="940" gradientUnits="userSpaceOnUse">
              <stop stop-color="${escapeXml(theme.bgStart ?? '#030703')}" />
              <stop offset="1" stop-color="${escapeXml(theme.bgEnd ?? '#071109')}" />
            </linearGradient>
            <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="3" fill="${escapeXml(theme.textStrong ?? '#6dff55')}" opacity="0.08" />
            </pattern>
            <style><![CDATA[${exportCss}]]></style>
          </defs>

          <rect x="14" y="14" width="1172" height="912" rx="18" fill="url(#bg)" stroke="${escapeXml(theme.textStrong ?? '#6dff55')}" stroke-width="2" />
          <rect x="28" y="28" width="1144" height="884" rx="14" fill="${escapeXml(theme.bgStart ?? '#040904')}" stroke="${escapeXml(theme.line ?? '#1D5724')}" stroke-width="1.5" />
          <rect x="28" y="28" width="1144" height="884" rx="14" fill="url(#scan)" opacity="0.85" />

          <foreignObject x="32" y="32" width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}">
            <div xmlns="http://www.w3.org/1999/xhtml" class="page" style="${themeStyle}">
              <div class="shell">
                <div class="shell-surface">
                  <div class="shell-content">
                    <header class="topbar">
                      <div class="brand">
                        <span class="brand-led"></span>
                        <div>
                          <p class="brand-kicker">${escapeXml(profileData.brandKicker ?? 'interactive profile')}</p>
                          <h1 class="brand-title">${escapeXml(profileData.siteTitle ?? 'retro terminal')}</h1>
                        </div>
                      </div>

                      <nav class="module-tabs">${renderTabs()}</nav>
                    </header>

                    <main class="screen">
                      <aside class="sidebar">
                        <div class="sidebar-header">
                          <p class="eyebrow">module items</p>
                          <h2 class="sidebar-title">${escapeXml(module.sidebarTitle)}</h2>
                        </div>

                        <div class="item-list">${renderSidebarItems()}</div>
                      </aside>

                      <section class="panel">
                        <div class="panel-frame">
                          <div class="panel-meta">
                            <div>
                              <p class="eyebrow">${escapeXml(item.eyebrow)}</p>
                              <h2 class="panel-title">${escapeXml(item.title)}</h2>
                              <p class="panel-subtitle">${escapeXml(item.subtitle)}</p>
                            </div>

                            <div class="panel-tag">${escapeXml(item.tag)}</div>
                          </div>

                          <div class="panel-body">
                            <div class="detail-block">
                              <p class="panel-copy">${escapeXml(item.copy)}</p>
                              ${renderPanelLinks()}
                              <ul class="panel-bullets">${renderBullets()}</ul>
                            </div>
                          </div>
                        </div>
                      </section>
                    </main>

                    <section class="dock">
                      <div>
                        <p class="eyebrow">signals</p>
                        <div class="signal-cards" style="--signal-count:${Math.max(profileData.signals?.length ?? 0, 1)}">${renderSignals()}</div>
                      </div>

                      <div>
                        <p class="eyebrow">links</p>
                        <div class="link-pills">${renderLinks()}</div>
                      </div>
                    </section>

                    <footer class="footer">
                      <span>${escapeXml(profileData.footerNote ?? '')}</span>
                      <span class="footer-separator">/</span>
                      <span>static view generated from shared data</span>
                    </footer>
                  </div>
                </div>
              </div>
            </div>
          </foreignObject>
        </svg>
`;

        await mkdir(assetDir, { recursive: true });
        await writeFile(outputPath, svg, 'utf8');

        console.log(`Generated ${outputPath}`);

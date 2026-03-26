import { profileData } from './src/profile-data.js';
import { getSocialIcon } from './src/social-icons.generated.js';

const state = {
  moduleIndex: 0,
  itemIndexByModule: Object.fromEntries((profileData.modules ?? []).map((module) => [module.id, 0]))
};

const elements = {
  brandKicker: document.getElementById('brand-kicker'),
  siteTitle: document.getElementById('site-title'),
  tabs: document.getElementById('module-tabs'),
  sidebarTitle: document.getElementById('sidebar-title'),
  itemList: document.getElementById('item-list'),
  panelEyebrow: document.getElementById('panel-eyebrow'),
  panelTitle: document.getElementById('panel-title'),
  panelSubtitle: document.getElementById('panel-subtitle'),
  panelTag: document.getElementById('panel-tag'),
  panelCopy: document.getElementById('panel-copy'),
  panelLinks: document.getElementById('panel-links'),
  panelBullets: document.getElementById('panel-bullets'),
  signalCards: document.getElementById('signal-cards'),
  linkPills: document.getElementById('link-pills'),
  footerNote: document.getElementById('footer-note')
};

const currentModule = () => profileData.modules?.[state.moduleIndex];

const currentItem = () => {
  const module = currentModule();
  if (!module) {
    return null;
  }

  return module.items?.[state.itemIndexByModule[module.id] ?? 0] ?? null;
};

function toCssVarName(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function applyTheme(theme = {}) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${toCssVarName(key)}`, value);
  });
}

function applyCrtEffects(crtEffects = {}) {
  const enabled = crtEffects.enabled !== false;

  document.body.classList.toggle('has-crt-effects', enabled);
  document.body.classList.toggle('has-crt-scanlines', enabled && crtEffects.scanlines !== false);
}

function applyBranding() {
  elements.brandKicker.textContent = profileData.brandKicker ?? 'interactive profile';
  elements.siteTitle.textContent = profileData.siteTitle ?? 'retro terminal';
  elements.footerNote.textContent = profileData.footerNote ?? '';

  if (profileData.siteTitle && profileData.name) {
    document.title = `${profileData.siteTitle} // ${profileData.name}`;
  }
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

function formatLinkDisplay(value) {
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
}

function createSocialIcon(entry) {
  const icon = getSocialIcon(entry);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'social-icon');
  svg.setAttribute('viewBox', icon.viewBox);
  svg.setAttribute('aria-hidden', 'true');

  if (icon.mode === 'stroke') {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    (icon.paths ?? []).forEach((pathData) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      svg.appendChild(path);
    });
  } else {
    svg.setAttribute('fill', 'currentColor');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', icon.path);
    svg.appendChild(path);
  }

  return svg;
}

function renderPanelLinks(item) {
  elements.panelLinks.replaceChildren();

  const displayValue = item.hrefLabel ?? (item.href ? formatLinkDisplay(item.href) : item.handle);
  if (!displayValue) {
    elements.panelLinks.hidden = true;
    return;
  }

  const line = createElement('div', 'panel-link-line');
  line.appendChild(createSocialIcon(item));

  if (item.href) {
    const anchor = createElement('a', 'panel-link-anchor', displayValue);
    anchor.href = item.href;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    line.appendChild(anchor);
  } else {
    line.appendChild(createElement('strong', 'panel-link-value', displayValue));
  }

  elements.panelLinks.hidden = false;
  elements.panelLinks.appendChild(line);
}

function renderTabs() {
  elements.tabs.replaceChildren();

  (profileData.modules ?? []).forEach((module, moduleIndex) => {
    const button = createElement('button', `tab-button${moduleIndex === state.moduleIndex ? ' is-active' : ''}`, module.label);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(moduleIndex === state.moduleIndex));
    button.addEventListener('click', () => {
      state.moduleIndex = moduleIndex;
      render();
    });
    elements.tabs.appendChild(button);
  });
}

function renderItems() {
  const module = currentModule();

  if (!module) {
    elements.sidebarTitle.textContent = '';
    elements.itemList.replaceChildren();
    return;
  }

  const activeIndex = state.itemIndexByModule[module.id] ?? 0;
  elements.sidebarTitle.textContent = module.sidebarTitle;
  elements.itemList.replaceChildren();

  module.items.forEach((item, itemIndex) => {
    const button = createElement('button', `item-button${itemIndex === activeIndex ? ' is-active' : ''}`);
    button.type = 'button';
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(itemIndex === activeIndex));
    button.addEventListener('click', () => {
      state.itemIndexByModule[module.id] = itemIndex;
      render();
    });

    button.append(
      createElement('span', '', item.label),
      createElement('span', 'item-button__index', String(itemIndex + 1).padStart(2, '0'))
    );

    elements.itemList.appendChild(button);
  });
}

function renderPanel() {
  const item = currentItem();

  if (!item) {
    return;
  }

  elements.panelEyebrow.textContent = item.eyebrow;
  elements.panelTitle.textContent = item.title;
  elements.panelSubtitle.textContent = item.subtitle;
  elements.panelTag.textContent = item.tag;
  elements.panelCopy.textContent = item.copy;
  renderPanelLinks(item);
  elements.panelBullets.replaceChildren();

  item.bullets.forEach((bullet) => {
    const li = document.createElement('li');
    li.textContent = bullet;
    elements.panelBullets.appendChild(li);
  });
}

function renderDock() {
  elements.signalCards.replaceChildren();
  elements.linkPills.replaceChildren();
  elements.footerNote.textContent = profileData.footerNote ?? '';
  elements.signalCards.style.setProperty('--signal-count', String(Math.max(profileData.signals?.length ?? 0, 1)));

  (profileData.signals ?? []).forEach((signal) => {
    const card = createElement('article', 'signal-card');
    card.append(
      createElement('strong', '', signal.value),
      createElement('span', '', signal.label)
    );
    elements.signalCards.appendChild(card);
  });

  (profileData.links ?? []).forEach((link) => {
    const anchor = createElement('a', 'link-pill');
    anchor.href = link.href;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.append(
      createSocialIcon(link),
      createElement('span', 'link-pill__meta', link.hrefLabel ?? formatLinkDisplay(link.href))
    );
    elements.linkPills.appendChild(anchor);
  });
}

function moveModule(direction) {
  const modules = profileData.modules ?? [];
  state.moduleIndex = (state.moduleIndex + direction + modules.length) % modules.length;
  render();
}

function moveItem(direction) {
  const module = currentModule();

  if (!module) {
    return;
  }

  const currentIndex = state.itemIndexByModule[module.id] ?? 0;
  state.itemIndexByModule[module.id] = (currentIndex + direction + module.items.length) % module.items.length;
  render();
}

function handleKeys(event) {
  if (!currentModule()) {
    return;
  }

  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === 'ArrowLeft') {
    moveModule(-1);
  } else if (event.key === 'ArrowRight') {
    moveModule(1);
  } else if (event.key === 'ArrowUp') {
    moveItem(-1);
  } else if (event.key === 'ArrowDown') {
    moveItem(1);
  }
}

function render() {
  renderTabs();
  renderItems();
  renderPanel();
  renderDock();
}

applyTheme(profileData.theme ?? {});
applyCrtEffects(profileData.crtEffects ?? {});
applyBranding();
window.addEventListener('keydown', handleKeys);
render();

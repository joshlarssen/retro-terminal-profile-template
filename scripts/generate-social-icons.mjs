import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as simpleIcons from 'simple-icons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.join(path.resolve(__dirname, '..'), 'src', 'social-icons.generated.js');

const iconEntries = Object.values(simpleIcons).filter((entry) => entry && typeof entry === 'object' && 'slug' in entry);
const brandIconsBySlug = new Map(iconEntries.map((entry) => [String(entry.slug).toLowerCase(), entry]));

const genericIcons = {
  website: {
    title: 'Website',
    mode: 'stroke',
    viewBox: '0 0 24 24',
    paths: [
      'M3 12h18',
      'M12 3c2.9 2.8 4.5 5.8 4.5 9s-1.6 6.2-4.5 9c-2.9-2.8-4.5-5.8-4.5-9S9.1 5.8 12 3Z',
      'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Z'
    ]
  },
  pages: {
    title: 'Pages',
    mode: 'stroke',
    viewBox: '0 0 24 24',
    paths: [
      'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z',
      'M4 9h16',
      'M8 6.5h.01',
      'M11 6.5h.01'
    ]
  },
  readme: {
    title: 'Readme',
    mode: 'stroke',
    viewBox: '0 0 24 24',
    paths: [
      'M7 4.5A2.5 2.5 0 0 1 9.5 2h7.1L21 6.4V19.5A2.5 2.5 0 0 1 18.5 22h-9A2.5 2.5 0 0 1 7 19.5v-15Z',
      'M16 2v5h5',
      'M10 11h6',
      'M10 15h6'
    ]
  },
  email: {
    title: 'Email',
    mode: 'stroke',
    viewBox: '0 0 24 24',
    paths: [
      'M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z',
      'm5 8 3 2.5L15 8',
      'm4 11 1.5-1',
      'm14.5 10-1.5 1'
    ]
  }
};

const fallbackBrandIcons = {
  linkedin: {
    title: 'LinkedIn',
    mode: 'stroke',
    viewBox: '0 0 24 24',
    paths: [
      'M4 4.5A1.5 1.5 0 0 1 5.5 3h13A1.5 1.5 0 0 1 20 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-15Z',
      'M8 10v6',
      'M8 7.5h.01',
      'M11 10v6',
      'M11 12.2a2.2 2.2 0 0 1 4.4 0V16'
    ]
  }
};

const supportedBrandSlugs = [
  'github',
  'linkedin',
  'x',
  'bluesky',
  'gitlab',
  'discord',
  'youtube',
  'twitch',
  'instagram',
  'mastodon'
];

const socialIcons = Object.fromEntries(
  supportedBrandSlugs.map((slug) => {
    const icon = brandIconsBySlug.get(slug);
    const fallbackIcon = fallbackBrandIcons[slug];

    if (!icon && !fallbackIcon) {
      throw new Error(`Could not find simple-icons slug '${slug}'.`);
    }

    return [
      slug,
      icon
        ? {
            title: icon.title,
            mode: 'fill',
            viewBox: '0 0 24 24',
            path: icon.path
          }
        : fallbackIcon
    ];
  })
);

Object.assign(socialIcons, genericIcons);

const source = `export const socialIcons = ${JSON.stringify(socialIcons, null, 2)};

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function detectByHost(href = '') {
  const value = normalize(href);
  if (!value) {
    return '';
  }

  if (value.startsWith('mailto:')) {
    return 'email';
  }

  try {
    const host = new URL(href).host.toLowerCase();
    if (host.includes('github.com')) return 'github';
    if (host.includes('linkedin.com')) return 'linkedin';
    if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
    if (host.includes('bsky.app') || host.includes('bluesky')) return 'bluesky';
    if (host.includes('gitlab.com')) return 'gitlab';
    if (host.includes('discord.com') || host.includes('discord.gg')) return 'discord';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('twitch.tv')) return 'twitch';
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('mastodon')) return 'mastodon';
  } catch {
    return '';
  }

  return '';
}

export function detectSocialIcon(entry = {}) {
  const explicit = normalize(entry.icon);
  if (explicit && socialIcons[explicit]) {
    return explicit;
  }

  const haystack = normalize([entry.id, entry.label, entry.title, entry.subtitle, entry.hrefLabel].filter(Boolean).join(' '));
  if (haystack.includes('readme')) return 'readme';
  if (haystack.includes('pages')) return 'pages';
  if (haystack.includes('mail') || haystack.includes('email')) return 'email';

  const fromHref = detectByHost(entry.href);
  if (fromHref) {
    return fromHref;
  }

  return 'website';
}

export function getSocialIcon(entry = {}) {
  return socialIcons[detectSocialIcon(entry)] ?? socialIcons.website;
}
`;

await writeFile(outputPath, source, 'utf8');
console.log(`Generated ${outputPath}`);

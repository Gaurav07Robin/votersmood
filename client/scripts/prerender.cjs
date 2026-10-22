const fs = require('fs');
const path = require('path');

const CLIENT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(CLIENT_DIR, 'dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`❌ Template not found at ${TEMPLATE_PATH}. Run "vite build" first.`);
  process.exit(1);
}

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// Helper to write static index.html into a directory
function writeRoute(routePath, { title, description, keywords, canonical, ogImage, schema, bodyHtml }) {
  const targetDir = path.join(DIST_DIR, routePath);
  fs.mkdirSync(targetDir, { recursive: true });

  let html = template;

  // Replace Title
  if (title) {
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  }

  // Replace Canonical
  const canonicalUrl = canonical || `https://www.opinar.in/${routePath.replace(/^\/+/, '')}`;
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(/<link rel="canonical"[^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  // Replace or inject Description
  if (description) {
    const descTag = `<meta name="description" content="${description}" />`;
    html = html.replace(/<meta name="description"[^>]*>/i, descTag);
    html = html.replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta property="twitter:description"[^>]*>/i, `<meta property="twitter:description" content="${description}" />`);
  }

  // Replace or inject Keywords
  if (keywords) {
    const kwTag = `<meta name="keywords" content="${keywords}" />`;
    if (html.includes('<meta name="keywords"')) {
      html = html.replace(/<meta name="keywords"[^>]*>/i, kwTag);
    } else {
      html = html.replace('</head>', `  ${kwTag}\n  </head>`);
    }
  }

  // Replace OG & Twitter Title
  if (title) {
    html = html.replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta property="twitter:title"[^>]*>/i, `<meta property="twitter:title" content="${title}" />`);
  }

  // Replace OG & Twitter Image
  if (ogImage) {
    html = html.replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);
    html = html.replace(/<meta property="twitter:image"[^>]*>/i, `<meta property="twitter:image" content="${ogImage}" />`);
  }

  // Replace OG URL
  html = html.replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta property="twitter:url"[^>]*>/i, `<meta property="twitter:url" content="${canonicalUrl}" />`);

  // Inject Schema.org JSON-LD
  if (schema) {
    const schemaTag = `\n  <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>`;
    html = html.replace('</head>', `${schemaTag}\n  </head>`);
  }

  // Inject pre-rendered initial body HTML into <div id="root">
  if (bodyHtml) {
    html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  }

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
}

console.log('⚡ Starting Opinar Static Pre-Rendering (SSG)...');
const startTime = Date.now();

// ========================================================
// 1. CORE PLATFORM HUBS
// ========================================================
const coreRoutes = [
  {
    path: 'directory',
    title: 'Elected Representatives Directory: MPs, MLAs & Local Leaders | Opinar',
    description: 'Search and ask open questions to 4,100+ verified Indian Members of Parliament (MPs) and Legislative Assembly (MLAs). Track performance and election track records.',
    keywords: 'politician directory, Indian MPs, Indian MLAs, elected representatives, search MP by constituency, contact MLA online, ask politicians open questions, India leader tracker',
    canonical: 'https://www.opinar.in/directory',
    bodyHtml: `
      <div style="max-width: 1200px; margin: 0 auto; padding: 40px 24px; font-family: Inter, -apple-system, sans-serif;">
        <header style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; margin-bottom: 24px;">
          <div style="font-family: monospace; font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
            🗂️ Official Constituency Directory
          </div>
          <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
            Elected Representatives & Citizen Open Questions
          </h1>
          <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.5;">
            Server-indexed performance metrics, verified citizen open questions, and constituency accountability statistics across 4,100+ Indian MPs and MLAs.
          </p>
        </header>
      </div>`
  },
  {
    path: 'elections',
    title: 'Indian Elections Intelligence (1952–2026): General, Assembly, Bypolls & Municipal | Opinar',
    description: 'Explore 70+ years of official Indian election returns across 543 Lok Sabha seats, 36 State Assemblies, high-stakes by-elections, and 62+ municipal corporations.',
    keywords: 'Indian election results, Lok Sabha elections 1952 to 2024, Vidhan Sabha state elections, by election tracker, municipal elections India, voter turnout, party seat tallies',
    canonical: 'https://www.opinar.in/elections',
    bodyHtml: `
      <div style="max-width: 1200px; margin: 0 auto; padding: 40px 24px; font-family: Inter, sans-serif;">
        <header style="background: #18181b; color: #ffffff; border: 1px solid #27272a; border-radius: 12px; padding: 28px; margin-bottom: 24px;">
          <h1 style="font-size: 32px; font-weight: 800; margin: 0 0 10px 0;">Elections Intelligence Hub</h1>
          <p style="font-size: 15px; color: #a1a1aa; margin: 0;">
            Track historical general elections, state assemblies, live by-elections, and municipal corporations across India from 1952 to 2026.
          </p>
        </header>
      </div>`
  },
  {
    path: 'elections/lok-sabha',
    title: 'Lok Sabha General Election Results (1952–2024): 543 Seats & Majorities | Opinar',
    description: 'Historical party tallies, winning candidate margins, vote shares, and prime ministerial government formations across all 18 Indian general elections since 1952.',
    keywords: 'Lok Sabha election results, Indian general elections 1952 to 2024, Lok Sabha party tally, parliamentary election winners, who won Lok Sabha majority, general election seat share India',
    canonical: 'https://www.opinar.in/elections/lok-sabha'
  },
  {
    path: 'elections/state',
    title: 'State Assembly Election Results India (1952–2026): Vidhan Sabha Seat Breakdowns | Opinar',
    description: 'Historical and live Vidhan Sabha assembly election results across 36 Indian States and Union Territories. Interactive party seat share timelines since 1952.',
    keywords: 'State assembly election results, Vidhan Sabha election, state elections India, Vidhan Sabha party seats tally, state election winners',
    canonical: 'https://www.opinar.in/elections/state'
  },
  {
    path: 'elections/by-elections',
    title: 'Live By-Election Radar India (2024–2026): Assembly & Lok Sabha Bypolls | Opinar',
    description: 'Live tracking of Indian by-elections, candidate nominations, voter turnouts, and margins across Wayanad, Karhal, Dausa, and key parliamentary and assembly seats.',
    keywords: 'by election results, bypoll results 2024, by elections India, assembly and parliamentary by-elections, live by-election tracker',
    canonical: 'https://www.opinar.in/elections/by-elections'
  },
  {
    path: 'elections/municipal',
    title: 'Municipal Election Results India (1952–2026): Mahanagar Palika, Wards & Mayors | Opinar',
    description: 'Explore municipal corporation and local body elections across Mumbai BMC, Delhi MCD, Kolkata KMC, and urban councils. Party majorities and ward standings.',
    keywords: 'municipal election results, mahanagar palika results, mcd delhi results 2022, bmc mumbai election 2017, kmc kolkata results, ghmc hyderabad',
    canonical: 'https://www.opinar.in/elections/municipal'
  },
  {
    path: 'polls',
    title: 'Official Civic Polls & Citizen Opinion Surveys | Opinar',
    description: 'Participate in live voter sentiment polls, state election predictions, leadership approval ratings, and community civic surveys across India.',
    keywords: 'civic polls, opinion polls India, election survey, voter sentiment, live political polls India, leader approval rating',
    canonical: 'https://www.opinar.in/polls'
  },
  {
    path: 'insights',
    title: 'Political Insights, Video Reels & Ground Journalism | Opinar',
    description: 'Verified investigative reports, breaking campaign rallies, judicial observations, and state election progressions across India on Opinar.',
    keywords: 'political insights, Indian politics reels, election news, ground reports India, campaign rally coverage India',
    canonical: 'https://www.opinar.in/insights'
  },
  {
    path: 'privacy-policy',
    title: 'Privacy Policy & Terms of Service | Opinar',
    description: 'Learn how Opinar protects citizen privacy, secures public open questions, ensures anonymous civic voting, and transparently processes Indian election data.',
    keywords: 'Opinar privacy policy, civic platform terms, voter data privacy India',
    canonical: 'https://www.opinar.in/privacy-policy'
  }
];

// Write core routes
for (const route of coreRoutes) {
  writeRoute(route.path, route);
}
console.log(`✅ Pre-rendered ${coreRoutes.length} core platform hubs.`);

// ========================================================
// 2. POLITICIAN PROFILES (4,110 REPRESENTATIVES)
// ========================================================
let leaders = [];
const cacheLocations = [
  path.join(CLIENT_DIR, 'src/data/leaders_cache.json'),
  path.join(CLIENT_DIR, '../server/data/leaders_cache.json')
];

for (const loc of cacheLocations) {
  if (fs.existsSync(loc)) {
    try {
      leaders = JSON.parse(fs.readFileSync(loc, 'utf8'));
      console.log(`📁 Loaded ${leaders.length} leaders from ${loc}`);
      break;
    } catch (e) {
      console.warn(`Could not read ${loc}:`, e.message);
    }
  }
}

let leaderCount = 0;
for (const leader of leaders) {
  if (!leader || !leader.id || !leader.name) continue;

  const slug = leader.id;
  const name = leader.name;
  const party = leader.party || 'Independent';
  const constituency = leader.constituency || 'Constituency';
  const state = leader.state || 'India';
  const portfolio = leader.portfolio || (leader.type === 'MP_LS' ? 'Member of Parliament (Lok Sabha)' : 'Member of Legislative Assembly');
  const photo = leader.profilePhoto || leader.photoURL || 'https://www.opinar.in/og-image.jpg';

  const title = `${name} - Political Profile, Career History & Constituency | Opinar`;
  const description = `View ${name}'s verified political career, election history from ${constituency}, ${state}, ${party} leadership record, and ask open questions on Opinar.`;
  const keywords = `${name}, ${party}, ${state} politics, ${name} ${constituency}, ${name} political career, ask question to ${name}, how to contact ${name} ${constituency} representative, ${name} election history`;
  const canonical = `https://www.opinar.in/directory/${slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "name": name,
        "jobTitle": portfolio,
        "image": photo,
        "affiliation": {
          "@type": "Organization",
          "name": party
        },
        "address": {
          "@type": "PostalAddress",
          "addressRegion": state,
          "addressCountry": "IN"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `Which constituency does ${name} represent?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${name} represents ${constituency} in ${state} as an elected representative with ${party}.`
            }
          },
          {
            "@type": "Question",
            "name": `How can I ask an open question to ${name}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `You can post a verified citizen open question directly on ${name}'s profile on Opinar.`
            }
          }
        ]
      }
    ]
  };

  const bodyHtml = `
    <div style="max-width: 1000px; margin: 0 auto; padding: 32px 24px; font-family: Inter, -apple-system, sans-serif;">
      <header style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; display: flex; gap: 20px; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <img src="${photo}" alt="${name}" style="width: 72px; height: 72px; border-radius: 12px; object-fit: cover; border: 1px solid #cbd5e1; background: #f8fafc;" onerror="this.style.display='none'" />
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 6px;">
            <span style="background: #0f172a; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">${party}</span>
            <span style="background: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${leader.type || 'Elected Representative'}</span>
          </div>
          <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">${name}</h1>
          <p style="font-size: 14px; color: #64748b; margin: 0;">📍 ${constituency}, ${state} • 💼 ${portfolio}</p>
        </div>
      </header>
      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Political Track Record & Citizen Engagement</h2>
        <p style="font-size: 14.5px; color: #334155; line-height: 1.6; margin: 0;">
          Verified political profile of ${name}, representing ${constituency} in ${state}. Verified citizens can review legislative performance, analyze election track records, and ask direct open questions on Opinar.
        </p>
      </section>
    </div>`;

  writeRoute(`directory/${slug}`, {
    title,
    description,
    keywords,
    canonical,
    ogImage: photo,
    schema,
    bodyHtml
  });

  leaderCount++;
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`🎉 SSG Pre-Rendering Complete! Generated ${coreRoutes.length + leaderCount} static HTML files in ${duration}s.`);

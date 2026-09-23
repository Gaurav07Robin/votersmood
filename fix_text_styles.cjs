const fs = require('fs');

// -----------------------------------------
// 1 & 2: Update Home.jsx
// -----------------------------------------
let homeText = fs.readFileSync('client/src/pages/Home.jsx', 'utf-8');

// Task 2: Remove the "OFFICIAL GAZETTE CIVIC DISCUSSIONS" subtitle
const subtitleRegex = /<div style=\{\{\s*fontFamily:\s*'var\(--font-mono\)',\s*fontSize:\s*'12px',\s*fontWeight:\s*700,\s*color:\s*'var\(--accent-primary\)',\s*letterSpacing:\s*'0.08em',\s*marginBottom:\s*'4px'\s*\}\}>\s*.*?OFFICIAL GAZETTE CIVIC DISCUSSIONS\s*<\/div>/g;
homeText = homeText.replace(subtitleRegex, '');

// Task 1: Fix hashtag text overflow
// Look for the span rendering the election tag in the trending section
const tagSpanRegex = /<span style=\{\{\s*fontFamily:\s*'var\(--font-sans\)',\s*fontSize:\s*'14px',\s*fontWeight:\s*600,\s*color:\s*'#0369A1'\s*\}\}>\s*\{election\.startsWith\('#'\) \? election : `#\$\{election\}`\}\s*<\/span>/g;
const fixedTagSpan = `<span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#0369A1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', display: 'inline-block' }}>
                    {election.startsWith('#') ? election : \`#\${election}\`}
                  </span>`;
homeText = homeText.replace(tagSpanRegex, fixedTagSpan);

// In case the flex layout needs adjustment to allow text truncation:
const flexRowRegex = /<div key=\{idx\} style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center',\s*paddingBottom:\s*'12px',\s*borderBottom:[^}]*\}\}>/g;
// Ensure we don't accidentally replace the issues flex row if they are identical, though it's fine if we do. 
// Actually, let's just use string replace for both.
fs.writeFileSync('client/src/pages/Home.jsx', homeText, 'utf-8');
console.log("Home.jsx updated");

// -----------------------------------------
// 3 & 4: Update PostComposer.jsx
// -----------------------------------------
let composerText = fs.readFileSync('client/src/components/PostComposer.jsx', 'utf-8');

// Task 3: Remove / PETITION
composerText = composerText.replace('MARK THIS POST AS A PUBLIC ISSUE / PETITION', 'MARK THIS POST AS A PUBLIC ISSUE');

// Task 4: Remove / ADMINISTRATION
composerText = composerText.replace('TARGET ELECTION / ADMINISTRATION', 'TARGET ELECTION');

fs.writeFileSync('client/src/components/PostComposer.jsx', composerText, 'utf-8');
console.log("PostComposer.jsx updated");

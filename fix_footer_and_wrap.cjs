const fs = require('fs');

// 1. Remove Footer from App.jsx
let appText = fs.readFileSync('client/src/App.jsx', 'utf-8');
// Use regex to remove the entire footer element and its contents
const footerRegex = /<footer[^>]*>[\s\S]*?<\/footer>/;
appText = appText.replace(footerRegex, '');
fs.writeFileSync('client/src/App.jsx', appText, 'utf-8');
console.log("App.jsx footer removed");

// 2. Fix Home.jsx Sidebar Width and Tag Wrapping
let homeText = fs.readFileSync('client/src/pages/Home.jsx', 'utf-8');

// Increase right column width from 340px to 380px
homeText = homeText.replace(
  "gridTemplateColumns: '1fr 340px'",
  "gridTemplateColumns: '1fr 380px'"
);

// Fix the hashtag span to wrap instead of truncate with ellipsis
const badSpanRegex = /<span style=\{\{\s*fontFamily:\s*'var\(--font-sans\)',\s*fontSize:\s*'14px',\s*fontWeight:\s*600,\s*color:\s*'#0369A1',\s*whiteSpace:\s*'nowrap',\s*overflow:\s*'hidden',\s*textOverflow:\s*'ellipsis',\s*maxWidth:\s*'200px',\s*display:\s*'inline-block'\s*\}\}>/g;
const goodSpan = `<span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#0369A1', wordBreak: 'break-word', display: 'inline-block', lineHeight: 1.3 }}>`;

homeText = homeText.replace(badSpanRegex, goodSpan);

fs.writeFileSync('client/src/pages/Home.jsx', homeText, 'utf-8');
console.log("Home.jsx layout and wrapping updated");

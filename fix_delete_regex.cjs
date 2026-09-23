const fs = require('fs');
let text = fs.readFileSync('client/src/components/PostCard.jsx', 'utf-8');

const regex = /<button onClick=\{handleDeletePost\} className="btn-ghost" style=\{\{\s*fontSize:\s*'11px',\s*color:\s*'var\(--color-error\)',\s*fontWeight:\s*700\s*\}\}>\s*.*?DELETE\s*<\/button>/g;

const newBtn = `<button onClick={handleDeletePost} className="btn-ghost" style={{ fontSize: '14px', padding: '2px 4px', color: 'var(--color-error)' }} title="Delete Post">🗑️</button>`;

if (regex.test(text)) {
  text = text.replace(regex, newBtn);
  fs.writeFileSync('client/src/components/PostCard.jsx', text, 'utf-8');
  console.log("Success! Button updated.");
} else {
  console.log("Regex didn't match.");
}

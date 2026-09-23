const fs = require('fs');

let text = fs.readFileSync('client/src/components/PostCard.jsx', 'utf-8');
const regex = /<button onClick=\{handleDeletePost\} className="btn-ghost" style=\{\{ fontSize: '14px', padding: '2px 4px', color: 'var\(--color-error\)' \}\} title="Delete Post">\s*🗑️\s*<\/button>/g;

const redTrashSvg = `<button onClick={handleDeletePost} className="btn-ghost" style={{ fontSize: '14px', padding: '2px 4px', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Post">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>`;

if (regex.test(text)) {
  text = text.replace(regex, redTrashSvg);
  fs.writeFileSync('client/src/components/PostCard.jsx', text, 'utf-8');
  console.log("Success! SVG Trash applied to PostCard.");
} else {
  console.log("Regex didn't match in PostCard.");
}

let commentText = fs.readFileSync('client/src/components/CommentThread.jsx', 'utf-8');
const commentRegex = /<button\s*onClick=\{\(\) => onDeleteComment\(comment\.id\)\}\s*className="btn-ghost"\s*style=\{\{\s*fontSize:\s*'11px',\s*color:\s*'var\(--color-error\)',\s*fontWeight:\s*600,\s*padding:\s*'2px 4px'\s*\}\}\s*>\s*🗑️\s*<\/button>/g;
const commentRedTrashSvg = `<button onClick={() => onDeleteComment(comment.id)} className="btn-ghost" style={{ fontSize: '12px', color: 'var(--color-error)', padding: '2px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Comment">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>`;

if (commentRegex.test(commentText)) {
  commentText = commentText.replace(commentRegex, commentRedTrashSvg);
  fs.writeFileSync('client/src/components/CommentThread.jsx', commentText, 'utf-8');
  console.log("Success! SVG Trash applied to CommentThread.");
} else {
  console.log("Regex didn't match in CommentThread.");
}

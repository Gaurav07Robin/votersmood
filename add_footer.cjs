const fs = require('fs');
let c = fs.readFileSync('client/src/App.jsx', 'utf8');

c = c.replace(
  /<RegisterModal isOpen=\{isRegisterOpen\} onClose=\{closeRegisterModal\} \/>/,
  `<RegisterModal isOpen={isRegisterOpen} onClose={closeRegisterModal} />
      <footer style={{ textAlign: 'center', padding: '20px', backgroundColor: '#18181B', color: '#71717A', fontSize: '12px', borderTop: '1px solid #27272A' }}>
        &copy; {new Date().getFullYear()} JanMat. All rights reserved. &middot; <a href="/privacy-policy" onClick={(e) => { e.preventDefault(); handleTabChange('privacy-policy'); }} style={{ color: '#3B82F6', textDecoration: 'none' }}>Privacy Policy</a>
      </footer>`
);

fs.writeFileSync('client/src/App.jsx', c);

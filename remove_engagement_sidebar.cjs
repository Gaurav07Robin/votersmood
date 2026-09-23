const fs = require('fs');

let text = fs.readFileSync('client/src/pages/Polls.jsx', 'utf-8');

// 1. Remove the EngagementSidebar import
text = text.replace("import EngagementSidebar from '../components/EngagementSidebar';\n", "");

// 2. Change two-column-grid to a simple div max-width for better reading if it's a single column, 
// or just keep it 100% since it's the main column. Let's make it gridTemplateColumns: '1fr' to be safe.
const oldGrid = `<div className="two-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>`;
const newGrid = `<div style={{ display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', width: '100%' }}>`;

text = text.replace(oldGrid, newGrid);

// 3. Remove Right Sidebar Column completely
const rightSidebarRegex = /\{\/\* Right Sidebar Column \*\/\}\s*<div>\s*<EngagementSidebar \/>\s*<\/div>/g;
text = text.replace(rightSidebarRegex, "");

fs.writeFileSync('client/src/pages/Polls.jsx', text, 'utf-8');
console.log("Updated Polls.jsx layout");

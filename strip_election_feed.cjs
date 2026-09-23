const fs = require('fs');

let text = fs.readFileSync('client/src/components/CommunityPollsSection.jsx', 'utf-8');

const startStr = "{/* Community Election Discussions Section */}";
const endStr = "<CreateCommunityPollModal";

const startIndex = text.indexOf(startStr);
const endIndex = text.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  text = text.substring(0, startIndex) + text.substring(endIndex);
  fs.writeFileSync('client/src/components/CommunityPollsSection.jsx', text, 'utf-8');
  console.log("Success! Removed discussion section.");
} else {
  console.log("Could not find start or end index.");
}

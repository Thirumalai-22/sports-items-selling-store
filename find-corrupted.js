const fs = require('fs');

const file = 'index.html';
const content = fs.readFileSync(file, 'utf8');

// Find all matches of 2 or more corrupted characters (typically starting with ð or â)
// We'll just look for words that contain non-ascii characters.
const matches = content.match(/[^\x00-\x7F]+/g);
const uniqueMatches = [...new Set(matches)];

console.log("Mojibake mapping to investigate:");
uniqueMatches.forEach(m => {
  console.log(m, "-> hex:", Buffer.from(m).toString('hex'));
});

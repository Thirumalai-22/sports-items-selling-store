const fs = require('fs');

const file = 'wish.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('ðŸ”²', '🔲');
content = content.replace('ðŸ“‹', '📋');
content = content.replace('ðŸ“¤', '📤');
content = content.replace('ðŸ—‘ï¸ ', '🗑️');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed wish.html header emojis');

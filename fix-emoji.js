const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const mapping = {
    'ðŸŽ¯': '🎯',
    'ðŸ¥ ': '🥏',
    'â ¤ï¸ ': '❤️',
    'ðŸ” ': '🔍',
    'ðŸ›’': '🛒',
    'ðŸ‘‹': '👋',
    'ðŸ’ ': '💐',
    'â­ ': '⭐',
    'âž¡ï¸ ': '➡️',
    'âœ”ï¸ ': '✔️',
    'âš¡': '⚡',
    'ðŸ ƒ': '🏃',
    'ðŸŽ¾': '🎾',
    'ðŸ †': '🏆',
    'ðŸ €': '🏀',
    'ðŸ  ': '🏏',
    'ðŸ« ': '🫏',
    'ðŸ“ž': '📞',
    'ðŸ“©': '📩',
    'âœ‹': '✋',
    'â˜Žï¸ ': '☎️',
    'ðŸ“±': '📱',
    'ðŸ¤–': '🤖',
    'ðŸ Ž': '🍎',
    'ðŸŽ¨': '🎨',
    'ðŸ“¸': '📸',
    'ðŸ ¦': '🐦',
    'ðŸ“º': '📺',
    'ðŸ˜Š': '😊'
};

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [bad, good] of Object.entries(mapping)) {
        if (content.includes(bad)) {
            content = content.split(bad).join(good);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed emojis in ${file}`);
    }
});

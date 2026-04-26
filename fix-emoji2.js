const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const mapping = {
    'c3b0c5b8c2a5c28f': '🥏',
    'c3a2c29dc2a4c3afc2b8c28f': '❤️',
    'c3b0c5b8e2809dc28d': '🔍',
    'c3b0c5b8e28099c290': '💐',
    'c3a2c2adc290c3a2c2adc290c3a2c2adc290c3a2c2adc290c3a2c2adc290': '⭐⭐⭐⭐⭐',
    'c3a2c2adc290': '⭐',
    'c3a2c5bec2a1c3afc2b8c28f': '➡️',
    'c3a2c593e2809dc3afc2b8c28f': '✔️',
    'c3a2c2ace280a1c3afc2b8c28f': '⬇️',
    'c3b0c5b8c28fc692': '🏃',
    'c3b0c5b8c28fe280a0': '🏆',
    'c3b0c5b8c28fe282ac': '🏀',
    'c3b0c5b8c28fc28f': '🏏',
    'c3b0c5b8c2abc28f': '🫏',
    'c3a2cb9cc5bdc3afc2b8c28f': '☎️',
    'c3b0c5b8c28dc5bd': '🍎',
    'c3b0c5b8c290c2a6': '🐦',
    'c382c2a9': '©'
};

files.forEach(file => {
    const filePath = path.join(dir, file);
    let buf = fs.readFileSync(filePath);
    let changed = false;
    
    for (const [badHex, goodStr] of Object.entries(mapping)) {
        const badBuf = Buffer.from(badHex, 'hex');
        const goodBuf = Buffer.from(goodStr, 'utf8');
        
        let index;
        while ((index = buf.indexOf(badBuf)) !== -1) {
            const before = buf.subarray(0, index);
            const after = buf.subarray(index + badBuf.length);
            buf = Buffer.concat([before, goodBuf, after]);
            changed = true;
        }
    }
    
    if (changed) {
        fs.writeFileSync(filePath, buf);
        console.log(`Fixed emojis in ${file}`);
    }
});

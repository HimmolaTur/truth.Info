const fs = require('fs');
const path = require('path');
const https = require('https');

const AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jasper",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Mimi",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Bandit",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Peanut",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Sasha",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Simba",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zoe"
];

const dir = path.join(__dirname, 'public', 'avatars');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let downloaded = 0;

AVATARS.forEach((url, index) => {
  const filePath = path.join(dir, `avatar${index + 1}.svg`);
  https.get(url, (res) => {
    const writeStream = fs.createWriteStream(filePath);
    res.pipe(writeStream);
    writeStream.on('finish', () => {
      writeStream.close();
      downloaded++;
      console.log(`Downloaded avatar${index + 1}.svg`);
      if (downloaded === AVATARS.length) {
        console.log("All avatars downloaded successfully!");
      }
    });
  }).on('error', (err) => {
    console.error(`Error downloading avatar${index + 1}.svg:`, err.message);
  });
});

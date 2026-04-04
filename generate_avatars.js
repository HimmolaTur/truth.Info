const fs = require('fs');
const path = require('path');
const { createAvatar } = require('@dicebear/core');
const { bottts } = require('@dicebear/collection');

const SEEDS = [
  "Felix",
  "Aneka",
  "Jasper",
  "Mimi",
  "Bandit",
  "Peanut",
  "Sasha",
  "Simba",
  "Oliver",
  "Zoe"
];

const dir = path.join(__dirname, 'public', 'avatars');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

SEEDS.forEach((seed, index) => {
  const avatar = createAvatar(bottts, {
    seed: seed,
  });

  const svg = avatar.toString();
  const filePath = path.join(dir, `avatar${index + 1}.svg`);
  
  fs.writeFileSync(filePath, svg);
  console.log(`Generated avatar${index + 1}.svg`);
});

console.log("All avatars generated successfully!");

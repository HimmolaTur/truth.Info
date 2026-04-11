const fs = require('fs');
const path = require('path');

const replacements = {
  'src/components/NewsCarousel.tsx': [
    { old: "'/images/photo-.jpg'", new: "'/images/photo-1504711434969-e33886168f5c.jpg'" }
  ],
  'src/app/[locale]/factcheck/page.tsx': [
    { old: '"/images/photo-.jpg"', new: '"/images/photo-1503694978374-8a2fa686963a.jpg"' }
  ],
  'src/app/[locale]/timeline/page.tsx': [
    { old: '"/images/photo-.jpg"', new: '"/images/photo-1557426272-fc759fdf7a8d.jpg"' }
  ],
  'src/app/[locale]/news/page.tsx': [
    { old: '"/images/photo-.jpg"', new: '"/images/photo-1584483766114-2cea6facdf57.jpg"' },
    { old: '"/images/photo-.jpg"', new: '"/images/photo-1504711434969-e33886168f5c.jpg"' } // Will replace sequentially, wait, `replaceAll` or manual
  ],
  'src/app/[locale]/news/[id]/page.tsx': [
    { old: "'/images/photo-.jpg'", new: "'/images/photo-1504711434969-e33886168f5c.jpg'" }
  ],
  'src/app/[locale]/page.tsx': [
    { old: 'const IMG_HERO =\n  "/images/photo-.jpg";', new: 'const IMG_HERO =\n  "/images/photo-1451187580459-43490279c0fa.jpg";' },
    { old: 'const IMG_FEATURES =\n  "/images/photo-.jpg";', new: 'const IMG_FEATURES =\n  "/images/photo-1518770660439-4636190af475.jpg";' },
    { old: 'const IMG_CTA =\n  "/images/photo-.jpg";', new: 'const IMG_CTA =\n  "/images/photo-1532375810709-75b1da00537c.jpg";' },
    { old: "'/images/photo-.jpg'", new: "'/images/photo-1504711434969-e33886168f5c.jpg'" }
  ],
  'src/app/[locale]/map/page.tsx': [
    { old: '"/images/photo-.jpg"', new: '"/images/photo-1495020689067-958852a7765e.jpg"' }
  ],
  'src/app/[locale]/forum/page.tsx': [
    { old: '"/images/photo-.jpg"', new: '"/images/photo-1580130281320-0ef0754f2bf7.jpg"' }
  ]
};

for (const [file, reps] of Object.entries(replacements)) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // For news/page.tsx, manual replace
    if (file === 'src/app/[locale]/news/page.tsx') {
        content = content.replace('const IMG_HERO =\n  "/images/photo-.jpg";', 'const IMG_HERO =\n  "/images/photo-1584483766114-2cea6facdf57.jpg";');
        content = content.replace('"/images/photo-.jpg"', '"/images/photo-1504711434969-e33886168f5c.jpg"');
    } else {
        for (const rep of reps) {
            content = content.replace(rep.old, rep.new);
        }
    }
    fs.writeFileSync(fullPath, content);
  }
}

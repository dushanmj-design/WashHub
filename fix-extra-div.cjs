const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  "          )}\n        </div>\n      </main>",
  "          )}\n      </main>"
);
fs.writeFileSync('src/App.tsx', content);

const fs = require('fs');
let printUtils = fs.readFileSync('src/lib/printUtils.ts', 'utf8');

printUtils = printUtils.replace(
  /max-width: 80mm;\s*margin: 0 auto;\s*padding: 10px 0;\s*page-break-after: always;\s*display: flex;\s*justify-content: center;/g,
  'padding: 0;\n             margin: 0;\n             page-break-after: always;'
);

fs.writeFileSync('src/lib/printUtils.ts', printUtils);

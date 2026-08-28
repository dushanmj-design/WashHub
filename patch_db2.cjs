const fs = require('fs');
let code = fs.readFileSync('src/database.ts', 'utf8');

const target = `workflow: 'wash_dry_iron', // Defaulting for types`;
const replacement = `workflow: payload.services ? Object.keys(payload.services).filter(k => payload.services[k]).join('_') : 'wash_dry_iron',`;

code = code.replace(target, replacement);
fs.writeFileSync('src/database.ts', code);

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `shopName: activeTenant.name || 'Wash Hub'
      });`;
const replacement = `shopName: activeTenant.name || 'Wash Hub',
        isSupervisor: true,
        supervisor_data: resData.order.supervisor_data || payload
      });`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);

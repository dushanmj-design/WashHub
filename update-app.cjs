const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '<SupervisorIntake \n                    onSubmit={handleSupervisorIntake}\n                    isLoading={isActionLoading}\n                    activeTenantId={activeTenant?.id}\n                    activeRole={activeRole}\n                  />',
  '<SupervisorIntake \n                    onSubmit={handleSupervisorIntake}\n                    isLoading={isActionLoading}\n                    activeTenantId={activeTenant?.id}\n                    activeRole={activeRole}\n                    orders={orders}\n                  />'
);

fs.writeFileSync('src/App.tsx', content);

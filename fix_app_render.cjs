const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<OrderIntake 
                  onSubmit={handleOrderIntake} 
                  isLoading={isActionLoading} 
                  activeTenantId={activeTenant?.id}
                  activeRole={activeRole}
                />`;

const replacement = `
                {activeRole === 'supervisor' ? (
                  <SupervisorIntake 
                    onSubmit={handleSupervisorIntake}
                    isLoading={isActionLoading}
                    activeTenantId={activeTenant?.id}
                    activeRole={activeRole}
                  />
                ) : (
                  <OrderIntake 
                    onSubmit={handleOrderIntake} 
                    isLoading={isActionLoading} 
                    activeTenantId={activeTenant?.id}
                    activeRole={activeRole}
                  />
                )}
`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);

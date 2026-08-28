const fs = require('fs');
let code = fs.readFileSync('src/database.ts', 'utf-8');
code = code.replace(
  `public loginUser(email: string): { user: User; tenant?: Tenant } {`,
  `public loginUser(email: string, password?: string): { user: User; tenant?: Tenant } {`
);
code = code.replace(
  `if (!user) {
      throw new Error(\`Invalid email address: \${email}\`);
    }`,
  `if (!user) {
      throw new Error(\`Invalid email or password\`);
    }
    if (password && user.password && user.password !== password) {
      throw new Error(\`Invalid email or password\`);
    }`
);
fs.writeFileSync('src/database.ts', code);

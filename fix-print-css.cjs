const fs = require('fs');
let printUtils = fs.readFileSync('src/lib/printUtils.ts', 'utf8');

printUtils = printUtils.replace(
  /<head>[\s\S]*?<\/head>/g,
  `<head>
        <title>\${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        \${styles}
        <style>
          @page { 
            margin: 0; 
            size: 80mm auto;
          }
          body { 
            background: white !important; 
            color: black !important;
            margin: 0;
            padding: 0;
            width: 576px; /* 80mm standard printable width at 203 DPI */
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .receipt-page { 
             width: 576px;
             padding: 0;
             margin: 0;
             page-break-after: always;
             -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
          }
          /* Force inner content to take full width of the 576px */
          .receipt-content-wrapper {
             width: 100% !important;
             max-width: 100% !important;
             margin: 0 !important;
          }
          \${styleContent}
        </style>
      </head>`
);

fs.writeFileSync('src/lib/printUtils.ts', printUtils);

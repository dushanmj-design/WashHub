export function printHtml(htmlContent: string, title: string) {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this site to print receipts.');
    return;
  }

  let bodyContent = htmlContent;
  let styleContent = '';
  
  const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    styleContent = styleMatch[1];
  }
  
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1];
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${styles}
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
          ${styleContent}
        </style>
      </head>
      <body>
        ${bodyContent}
        <script>
          // Wait a tiny bit for styles and fonts to paint, then print and close
          window.onload = () => {
            setTimeout(() => {
              window.focus();
              window.print();
              // Try to close the window after printing (some browsers might block if not directly user initiated, but mostly works)
              setTimeout(() => { window.close(); }, 500);
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

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
        ${styles}
        <style>
          @page { margin: 0; }
          body { 
            background: white !important; 
            color: black !important;
            margin: 0;
            padding: 0;
            width: 100%;
          }
          .receipt-page {
             width: 100%;
             max-width: 80mm;
             margin: 0 auto;
             padding: 10px 0;
             page-break-after: always;
             display: flex;
             justify-content: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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

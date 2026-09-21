export function printHtml(htmlContent: string, title: string) {
  const printWindow = window.open('', '_blank', 'width=450,height=700');
  
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
        <base href="${window.location.origin}/">
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${styles}
        <style>
          * {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { 
            margin: 0mm !important; 
            size: 80mm auto !important;
          }
          html, body { 
            background: white !important; 
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            font-family: Arial, Helvetica, sans-serif !important;
            display: block !important;
          }
          @media print {
            @page {
              size: 80mm auto !important;
              margin: 0mm !important;
            }
            html, body {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .receipt-page { 
              width: 100% !important;
              min-width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              page-break-after: always;
              break-after: page;
            }
            .receipt-content-wrapper { 
              width: 100% !important;
              min-width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 1.5mm 1mm !important;
              box-sizing: border-box !important;
            }
            .receipt-content-wrapper * {
              box-sizing: border-box !important;
            }
          }
          /* Screen preview inside popup */
          @media screen {
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              background: #f1f5f9 !important;
              padding: 10px 0;
            }
            .receipt-content-wrapper {
              width: 100% !important;
              max-width: 380px !important;
              background: #ffffff !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              padding: 12px !important;
              margin-bottom: 20px;
            }
          }
          ${styleContent}
        </style>
      </head>
      <body>
        ${bodyContent}
        <script>
          function runPrint() {
            window.focus();
            window.print();
            setTimeout(() => {
              try { window.close(); } catch(e) {}
            }, 1200);
          }
          if (document.readyState === 'complete') {
            setTimeout(runPrint, 350);
          } else {
            window.addEventListener('load', () => setTimeout(runPrint, 350));
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

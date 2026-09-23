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
          }
          html, body { 
            background: #ffffff !important; 
            color: #000000 !important;
            margin: 0 !important; 
            padding: 0 !important;
            width: 100% !important;
            font-family: Arial, Helvetica, sans-serif !important;
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @media print {
            @page {
              margin: 0mm !important;
            }
            html, body {
              width: 72mm !important;
              max-width: 72mm !important;
              min-width: 72mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              color: #000000 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              height: auto !important;
              overflow: visible !important;
            }
            .receipt-page { 
              width: 72mm !important;
              min-width: 72mm !important;
              max-width: 72mm !important;
              padding: 0 !important;
              margin: 0 auto !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              -webkit-column-break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              box-sizing: border-box !important;
              overflow: visible !important;
            }
            /* Prevent duplicate cuts or tiny shredded strips after the final bill */
            .receipt-page:last-child,
            .receipt-page.receipt-page-last { 
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            /* Spacing for subsequent bills */
            .receipt-page + .receipt-page {
              padding-top: 1mm !important;
            }
            .receipt-content-wrapper { 
              width: 72mm !important;
              min-width: 72mm !important;
              max-width: 72mm !important;
              margin: 0 auto !important;
              padding: 1mm 0.5mm 0 0.5mm !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              -webkit-column-break-inside: avoid !important;
              overflow: visible !important;
            }
            /* Feeds paper past thermal head so the auto cutter knife cuts cleanly without cutting receipt text */
            .receipt-cutter-spacer {
              display: block !important;
              min-height: 8mm !important;
              width: 100% !important;
              clear: both !important;
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
              padding: 12px 0;
            }
            .receipt-content-wrapper {
              width: 100% !important;
              max-width: 380px !important;
              background: #ffffff !important;
              box-shadow: 0 4px 14px rgba(0,0,0,0.15);
              padding: 14px !important;
              margin-bottom: 20px;
            }
            .receipt-cutter-spacer {
              display: block !important;
              height: 10px !important;
              min-height: 10px !important;
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

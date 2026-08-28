export function printHtml(htmlContent: string, title: string) {
  // Extract body content and styles if it's a full HTML document
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

  // Create or get the print container
  let printContainer = document.getElementById('pos-print-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'pos-print-container';
    document.body.appendChild(printContainer);
  }

  // Create or get the print styles
  let printStyle = document.getElementById('pos-print-style');
  if (!printStyle) {
    printStyle = document.createElement('style');
    printStyle.id = 'pos-print-style';
    document.head.appendChild(printStyle);
  }

  // Set the print CSS to hide everything else
  printStyle.innerHTML = `
    @media screen {
      #pos-print-container { display: none !important; }
    }
    @media print {
      body > *:not(#pos-print-container) { display: none !important; }
      #cycleon-root { display: none !important; }
      
      #pos-print-container { 
        display: block !important;
        position: absolute; 
        left: 0; 
        top: 0;
        width: 100%;
        background: white;
        color: black;
        margin: 0;
        padding: 0;
      }
      ${styleContent}
    }
  `;

  // Set the content
  printContainer.innerHTML = bodyContent;
  document.title = title;

  // Print
  setTimeout(() => {
    window.print();
    // Revert title
    document.title = 'CycleOn POS';
  }, 250);
}

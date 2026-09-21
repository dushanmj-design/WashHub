// ESC/POS Web Bluetooth Direct Printing Utility
// Directly connects to Bluetooth thermal receipt printers from Chrome on Android/Desktop
// Bypasses third-party spooler apps like RawBT to avoid trial watermarks and scaling issues.

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function printDirectRawBT(data: EscPosReceiptData): { success: boolean; message?: string } {
  try {
    const bytes = buildEscPosPayload(data);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    // Direct RawBT protocol URI - passes raw ESC/POS commands directly into licensed RawBT
    const rawbtUri = `rawbt:data:application/octet-stream;base64,${base64}`;
    window.location.href = rawbtUri;
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'RawBT launch failed' };
  }
}

export interface EscPosReceiptData {
  shopName: string;
  phone: string;
  billNumber: string;
  isVendorCopy?: boolean;
  hasIron?: boolean;
  date: string;
  customerName: string;
  customerPhone: string;
  weight: string;
  pieces?: string;
  washAmount?: number | string;
  dryAmount?: number | string;
  ironAmount?: number | string;
  totalAmount: number | string;
  advanceAmount?: number | string;
  balanceAmount?: number | string;
  barcode: string;
}

export async function printDirectBluetooth(data: EscPosReceiptData): Promise<{ success: boolean; message?: string }> {
  if (!isWebBluetoothSupported()) {
    return {
      success: false,
      message: 'Web Bluetooth is not supported in this browser. Please use Google Chrome on Android or a PC with Bluetooth enabled.'
    };
  }

  try {
    // Request Bluetooth Device
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer GATT service
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Posiflex / Star / Rongta
        '0000ae00-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb'
      ]
    });

    if (!device.gatt) {
      throw new Error('Bluetooth device GATT interface is unavailable.');
    }

    const server = await device.gatt.connect();

    // Discover writable characteristic across known services
    let writeChar: any = null;
    const services = await server.getPrimaryServices();

    for (const service of services) {
      try {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char;
            break;
          }
        }
        if (writeChar) break;
      } catch (e) {
        // continue search
      }
    }

    if (!writeChar) {
      throw new Error('Could not find a writable communication channel on this Bluetooth printer.');
    }

    // Build ESC/POS command stream
    const bytes = buildEscPosPayload(data);

    // Send in chunks of 512 bytes (standard MTU safe size)
    const chunkSize = 512;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      if (writeChar.properties.writeWithoutResponse) {
        await writeChar.writeValueWithoutResponse(chunk);
      } else {
        await writeChar.writeValue(chunk);
      }
      await new Promise((r) => setTimeout(r, 25));
    }

    if (device.gatt.connected) {
      device.gatt.disconnect();
    }

    return { success: true };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return { success: false, message: 'Print cancelled (no Bluetooth printer selected).' };
    }
    return { success: false, message: err.message || 'Bluetooth connection failed.' };
  }
}

export function buildEscPosPayload(data: EscPosReceiptData): Uint8Array {
  const chunks: number[] = [];

  const encoder = new TextEncoder();
  const writeText = (str: string) => {
    const encoded = encoder.encode(str);
    for (let i = 0; i < encoded.length; i++) chunks.push(encoded[i]);
  };

  // 1. Initialize ESC/POS
  chunks.push(0x1B, 0x40);

  // 2. Header (Center, Double Size)
  chunks.push(0x1B, 0x61, 0x01); // Center
  chunks.push(0x1D, 0x21, 0x11); // Double width + double height
  writeText(`${data.shopName || 'WASH HUB'}\n`);

  chunks.push(0x1D, 0x21, 0x00); // Normal
  chunks.push(0x1B, 0x45, 0x01); // Bold ON
  writeText(`Tel: ${data.phone || '011 3041630, 011 2735490'}\n`);
  
  if (data.isVendorCopy) {
    writeText(`★ VENDOR / WORKSHOP TAG ★\n`);
    writeText(`(${data.hasIron ? 'WASH . DRY . IRON' : 'WASH . DRY'})\n`);
  } else {
    writeText(`CUSTOMER RECEIPT\n`);
  }
  chunks.push(0x1B, 0x45, 0x00); // Bold OFF

  writeText(`================================================\n`);

  // 3. Bill & Metadata
  chunks.push(0x1B, 0x61, 0x00); // Left align
  chunks.push(0x1B, 0x45, 0x01);
  writeText(`BILL NO  : ${data.billNumber}\n`);
  writeText(`DATE     : ${data.date}\n`);
  writeText(`CUSTOMER : ${data.customerName}\n`);
  writeText(`PHONE    : ${data.customerPhone}\n`);
  chunks.push(0x1B, 0x45, 0x00);

  writeText(`------------------------------------------------\n`);

  if (data.isVendorCopy) {
    // VENDOR TAG (Matches Card Format with clear box borders)
    writeText(`[+] WORKSHOP PROCESSING CARD:\n`);
    writeText(`+--------------------+-------------------------+\n`);
    writeText(`| WASH               | ${padRight(data.washAmount ? `[  ] Rs. ${data.washAmount}` : '[  ] Done', 23)} |\n`);
    writeText(`+--------------------+-------------------------+\n`);
    writeText(`| DRY                | ${padRight(data.dryAmount ? `[  ] Rs. ${data.dryAmount}` : '[  ] Done', 23)} |\n`);
    writeText(`+--------------------+-------------------------+\n`);
    if (data.hasIron) {
      writeText(`| IRON               | ${padRight(data.ironAmount ? `[  ] Rs. ${data.ironAmount}` : '[  ] Done', 23)} |\n`);
      writeText(`+--------------------+-------------------------+\n`);
    }
    writeText(`| AMOUNT             | ${padRight(`Rs. ${data.totalAmount}`, 23)} |\n`);
    writeText(`+--------------------+-------------------------+\n`);
    writeText(`| IN DATE            | ${padRight(data.date, 23)} |\n`);
    writeText(`+--------------------+-------------------------+\n`);
    writeText(`| NAME               | ${padRight(data.customerName, 23)} |\n`);
    writeText(`+--------------------+-------------------------+\n`);
    writeText(`| WEIGHT             | ${padRight(data.weight, 23)} |\n`);
    writeText(`+--------------------+-------------------------+\n`);
    writeText(`| BILL #             | ${padRight(data.billNumber, 23)} |\n`);
    writeText(`+--------------------+-------------------------+\n\n`);

    // QR Code Section
    chunks.push(0x1B, 0x61, 0x01); // Center
    chunks.push(0x1B, 0x45, 0x01);
    writeText(`SCAN WHEN READY\n`);
    chunks.push(0x1B, 0x45, 0x00);

    // ESC/POS Native QR Code (Model 2, size 7)
    const qrBytes = encoder.encode(data.barcode);
    const len = qrBytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // Model 2
    chunks.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // Size 6
    chunks.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06);
    // Error correction L (48)
    chunks.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30);
    // Store data
    chunks.push(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < qrBytes.length; i++) chunks.push(qrBytes[i]);
    // Print QR
    chunks.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);

    writeText(`\n* ${data.barcode} *\n`);
    writeText(`ATTACH TO LAUNDRY BAG\n`);
  } else {
    // Customer Receipt Detail
    writeText(`WEIGHT   : ${data.weight}\n`);
    if (data.pieces) writeText(`PIECES   : ${data.pieces}\n`);
    writeText(`------------------------------------------------\n`);
    writeText(`TOTAL    : Rs. ${data.totalAmount}\n`);
    if (data.advanceAmount) writeText(`ADVANCE  : Rs. ${data.advanceAmount}\n`);
    if (data.balanceAmount) writeText(`BALANCE  : Rs. ${data.balanceAmount}\n`);
    writeText(`================================================\n`);
    chunks.push(0x1B, 0x61, 0x01); // Center
    writeText(`Please bring this bill at collection.\n`);
    writeText(`Collect items within 30 days.\n`);
  }

  // Feed 4 lines & Auto Paper Cut
  writeText(`\n\n\n\n`);
  chunks.push(0x1D, 0x56, 0x41, 0x10); // GS V 65 16 (Full cut)

  return new Uint8Array(chunks);
}

function padRight(str: string, len: number): string {
  if (str.length >= len) return str.substring(0, len);
  return str + ' '.repeat(len - str.length);
}

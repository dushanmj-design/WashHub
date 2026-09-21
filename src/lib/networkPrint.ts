// Network Thermal ESC/POS Printing Utility
// Directly sends binary ESC/POS commands over TCP / HTTP to network receipt printers
// (e.g., Epson, Star, Rongta, Xprinter, POS-58/80 connected via LAN / Wi-Fi).

export interface NetworkPrinterConfig {
  id?: string;
  name: string;
  ip_address: string;
  port?: number;
}

const NETWORK_PRINTER_KEY = 'wash_hub_network_printer';

export function getSavedNetworkPrinter(): NetworkPrinterConfig | null {
  try {
    const raw = localStorage.getItem(NETWORK_PRINTER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse network printer from local storage', e);
  }
  return null;
}

export function saveNetworkPrinter(printer: NetworkPrinterConfig): void {
  try {
    localStorage.setItem(NETWORK_PRINTER_KEY, JSON.stringify(printer));
  } catch (e) {
    console.error('Failed to save network printer', e);
  }
}

export async function sendEscPosToNetworkPrinter(
  printerIp: string,
  printerPort: number = 9100,
  rawBytes: Uint8Array,
  tenantId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/printers/network-print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantId ? { 'x-tenant-id': tenantId } : {})
      },
      body: JSON.stringify({
        ip_address: printerIp.trim(),
        port: printerPort || 9100,
        data_base64: btoa(
          Array.from(rawBytes)
            .map((b) => String.fromCharCode(b))
            .join('')
        )
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, message: data.error || 'Network print failed' };
    }
    return { success: true, message: data.message || `Printed successfully to ${printerIp}:${printerPort}` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Could not connect to network printer service' };
  }
}

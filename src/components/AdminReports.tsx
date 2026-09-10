import React, { useState, useMemo } from 'react';
import { Calendar, FileText, Download, Printer } from 'lucide-react';
import { Order } from '../types';

interface AdminReportsProps {
  orders: Order[];
}

export default function AdminReports({ orders }: AdminReportsProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order.created_at) return false;
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, startDate, endDate]);

  const totalBills = filteredOrders.length;
  const totalAmount = filteredOrders.reduce((sum, order) => {
    // Determine the actual amount collected or estimated if not finalized
    // For cash summary, usually we want final_amount, but if not closed, fallback to estimated or advance?
    // Let's use final_amount if available, otherwise estimated_amount.
    return sum + (order.final_amount || order.estimated_amount || 0);
  }, 0);

  const exportCSV = () => {
    const headers = ['Bill No', 'Date', 'Name', 'Mobile Number', 'Amount'];
    const rows = filteredOrders.map(o => [
      o.barcode_id,
      new Date(o.created_at).toLocaleDateString(),
      // Escape quotes and commas
      `"${(o.customer_name || 'N/A').replace(/"/g, '""')}"`,
      o.customer_mobile,
      (o.final_amount || o.estimated_amount || 0).toFixed(2)
    ]);
    
    rows.push(['', '', '', 'Total Amount', totalAmount.toFixed(2)]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cash_Summary_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print reports.');
      return;
    }
    
    const html = `
      <html>
        <head>
          <title>Daily Cash Summary</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 5px; }
            h3 { text-align: center; font-size: 14px; font-weight: normal; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            .right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>WashHub - Daily Cash Summary</h1>
          <h3>Period: ${startDate} to ${endDate}</h3>
          
          <table>
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Date</th>
                <th>Name</th>
                <th>Mobile Number</th>
                <th class="right">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(o => `
                <tr>
                  <td>${o.barcode_id}</td>
                  <td>${new Date(o.created_at).toLocaleDateString()}</td>
                  <td>${o.customer_name || 'N/A'}</td>
                  <td>${o.customer_mobile}</td>
                  <td class="right">${(o.final_amount || o.estimated_amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" class="right">Total Bills: ${totalBills} | Total Amount:</td>
                <td class="right">${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Daily Cash Summary
          </h2>
          <p className="text-sm text-slate-500 mt-1">Generate reports for cash collected by date range.</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-slate-300 rounded-md py-2 px-3 text-sm shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-slate-300 rounded-md py-2 px-3 text-sm shadow-sm" />
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            <button onClick={exportCSV} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm">
              <Download className="h-4 w-4" /> Excel
            </button>
            <button onClick={printReport} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm">
              <Printer className="h-4 w-4" /> PDF / Print
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Bill No</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Customer Name</th>
              <th className="px-6 py-4 font-semibold">Mobile Number</th>
              <th className="px-6 py-4 font-semibold text-right">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  No records found for the selected date range.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-medium text-slate-900">{order.barcode_id}</td>
                  <td className="px-6 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-3">{order.customer_name || 'N/A'}</td>
                  <td className="px-6 py-3">{order.customer_mobile}</td>
                  <td className="px-6 py-3 text-right font-bold text-slate-900">{(order.final_amount || order.estimated_amount || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right">Total Bills: {totalBills}</td>
              <td className="px-6 py-4 text-right">Total Amount:</td>
              <td className="px-6 py-4 text-right text-lg text-blue-700">Rs. {totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

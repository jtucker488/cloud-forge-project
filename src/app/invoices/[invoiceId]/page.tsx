'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import { supabase } from '@/lib/supabase';
export default function InvoiceDetailsPage() {
  const { invoiceId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error('No access token found. Please log in.');
        const res = await fetch(`/api/invoices/${invoiceId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch invoice');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Error loading invoice');
      } finally {
        setLoading(false);
      }
    }
    if (invoiceId) fetchInvoice();
  }, [invoiceId]);

  const handleDownloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Invoice #${data.invoice.id}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Sales Order ID: ${data.salesOrder.id}`, 10, 30);
    doc.text(`Shipment ID: ${data.shipment.id}`, 10, 38);
    doc.text(`Customer: ${data.invoice.customer_name}`, 10, 46);
    doc.text(`Invoice Date: ${new Date(data.invoice.invoice_date).toLocaleDateString()}`, 10, 54);
    doc.text(`Due Date: ${new Date(data.invoice.due_date).toLocaleDateString()}`, 10, 62);
    doc.text(`Status: ${data.invoice.status}`, 10, 70);
    doc.text(`Payment Terms: ${data.invoice.payment_terms}`, 10, 78);

    let y = 90;
    doc.text('Line Items:', 10, y);
    y += 10;
    data.lineItems.forEach((item: any, idx: number) => {
      doc.text(
        `${idx + 1}. ${item.material_name || ''} ${item.grade || ''} x${item.quantity} @ $${item.unit_price}`,
        10,
        y
      );
      y += 8;
    });

    y += 10;
    doc.text(`Subtotal: $${data.invoice.subtotal_amount.toFixed(2)}`, 10, y);
    y += 8;
    doc.text(`Tax Rate: ${data.invoice.tax_rate}%`, 10, y);
    y += 8;
    doc.text(`Discount: $${data.invoice.discount_amount.toFixed(2)}`, 10, y);
    y += 8;
    doc.text(`Total: $${data.invoice.total_amount.toFixed(2)}`, 10, y);

    doc.save(`invoice-${data.invoice.id}.pdf`);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data) return <div className="p-8">No data found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Invoice #{data.invoice.id}</h1>
      <div className="mb-4">
        <div><b>Sales Order ID:</b> {data.salesOrder.id}</div>
        <div><b>Shipment ID:</b> {data.shipment.id}</div>
        <div><b>Customer:</b> {data.invoice.customer_name}</div>
        <div><b>Invoice Date:</b> {new Date(data.invoice.invoice_date).toLocaleDateString()}</div>
        <div><b>Due Date:</b> {new Date(data.invoice.due_date).toLocaleDateString()}</div>
        <div><b>Status:</b> {data.invoice.status}</div>
        <div><b>Payment Terms:</b> {data.invoice.payment_terms}</div>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Line Items</h2>
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Material</th>
              <th className="border px-2 py-1">Grade</th>
              <th className="border px-2 py-1">Qty</th>
              <th className="border px-2 py-1">Unit Price</th>
              <th className="border px-2 py-1">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item: any) => (
              <tr key={item.id}>
                <td className="border px-2 py-1">{item.material_name}</td>
                <td className="border px-2 py-1">{item.grade}</td>
                <td className="border px-2 py-1">{item.quantity}</td>
                <td className="border px-2 py-1">${item.unit_price}</td>
                <td className="border px-2 py-1">${item.subtotal_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-4">
        <div><b>Subtotal:</b> ${data.invoice.subtotal_amount.toFixed(2)}</div>
        <div><b>Tax Rate:</b> {data.invoice.tax_rate}%</div>
        <div><b>Discount:</b> ${data.invoice.discount_amount.toFixed(2)}</div>
        <div className="font-bold"><b>Total:</b> ${data.invoice.total_amount.toFixed(2)}</div>
      </div>
      <Button onClick={handleDownloadPDF}>Download PDF</Button>
    </div>
  );
}
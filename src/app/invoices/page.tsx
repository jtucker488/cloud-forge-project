"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Invoice {
  id: number;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  status: string;
  shipment_id: number;
}

function isOverdue(invoice: Invoice) {
  return (
    invoice.status.toLowerCase() !== 'paid' &&
    new Date(invoice.due_date) < new Date()
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error('No access token found. Please log in.');
        const res = await fetch('/api/invoices', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch invoices');
        const data = await res.json();
        setInvoices(data);
      } catch (err: any) {
        setError(err.message || 'Error loading invoices');
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const handleDownloadPDF = async (invoice: Invoice) => {
    const doc = new jsPDF();

    // Add Invoice Header
    doc.setFontSize(18);
    doc.text(`Invoice #${invoice.id}`, 14, 20);

    // Add Customer and Dates
    doc.setFontSize(12);
    doc.text(`Customer: ${invoice.customer_name}`, 14, 30);
    doc.text(`Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 14, 38);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 14, 46);

    // --- Fetch line items for this invoice ---
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    console.log('Fetching line items for invoice:', invoice.id);
    const res = await fetch(`/api/invoices/${invoice.id}/line-items`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const { lineItems } = await res.json();
    console.log('Fetched lineItems:', lineItems);

    // --- Fetch shipment info for this invoice ---
    console.log('Fetching shipment info for shipment_id:', invoice.shipment_id);
    const shipmentRes = await fetch(`/api/shipments/${invoice.shipment_id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const shipment = await shipmentRes.json();
    console.log('Fetched shipment:', shipment);

    // Add Shipment Info to PDF
    let shipmentY = 54;
    doc.setFontSize(12);
    doc.text(`Shipment Info:`, 14, shipmentY);
    shipmentY += 8;
    doc.setFontSize(10);
    doc.text(`Carrier: ${shipment.carrier || ''}`, 14, shipmentY);
    shipmentY += 6;
    doc.text(`Tracking #: ${shipment.tracking_number || ''}`, 14, shipmentY);
    shipmentY += 6;
    doc.text(`Shipping Address: ${shipment.shipping_address || ''}`, 14, shipmentY);
    shipmentY += 6;
    doc.text(`Planned Ship Date: ${shipment.planned_ship_date ? new Date(shipment.planned_ship_date).toLocaleDateString() : ''}`, 14, shipmentY);
    shipmentY += 6;
    doc.text(`Actual Ship Date: ${shipment.actual_ship_date ? new Date(shipment.actual_ship_date).toLocaleDateString() : ''}`, 14, shipmentY);

    // Add Line Items Table
    autoTable(doc, {
      head: [['Description', 'Quantity', 'Unit Price', 'Subtotal']],
      body: lineItems.map((item: any) => [
        item.description || item.material_name || '',
        item.quantity,
        `$${item.unit_price?.toFixed(2)}`,
        `$${(item.unit_price * item.quantity).toFixed(2)}`
      ]),
      startY: shipmentY + 4,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    // Add Amounts
    const finalY = (doc as any).lastAutoTable?.finalY || shipmentY + 4;
    doc.text(`Total Amount: $${invoice.total_amount.toFixed(2)}`, 14, finalY + 10);
    doc.text(`Status: ${invoice.status}`, 14, finalY + 18);

    // Footer
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 14, finalY + 30);

    // Download the PDF
    doc.save(`invoice-${invoice.id}.pdf`);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Invoices</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className={`rounded-lg border p-6 shadow-sm transition-all hover:shadow-md bg-white flex flex-col cursor-pointer ${
              isOverdue(invoice) ? 'border-red-500' : ''
            }`}
            onClick={() => router.push(`/invoices/${invoice.id}`)}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg">#{invoice.id}</span>
              {isOverdue(invoice) && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Overdue</span>
              )}
            </div>
            <div className="mb-2">
              <div className="text-sm text-gray-600">Customer</div>
              <div className="font-medium">{invoice.customer_name}</div>
            </div>
            <div className="mb-2 flex flex-col gap-1">
              <div>
                <span className="text-xs text-gray-500">Invoice Date: </span>
                {new Date(invoice.invoice_date).toLocaleDateString()}
              </div>
              <div>
                <span className="text-xs text-gray-500">Due Date: </span>
                {new Date(invoice.due_date).toLocaleDateString()}
              </div>
            </div>
            <div className="mb-2">
              <span className="text-xs text-gray-500">Total: </span>
              <span className="font-bold">${invoice.total_amount.toFixed(2)}</span>
            </div>
            <div className="mb-4">
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  invoice.status === 'Paid'
                    ? 'bg-green-100 text-green-700'
                    : invoice.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : isOverdue(invoice)
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {invoice.status}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={e => {
                e.stopPropagation();
                handleDownloadPDF(invoice);
              }}
            >
              Download PDF
            </Button>
          </div>
        ))}
      </div>
      {invoices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No invoices found</p>
        </div>
      )}
    </div>
  );
} 
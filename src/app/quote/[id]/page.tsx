"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/app/store";
import {
  fetchQuote,
  selectCurrentQuote,
  selectQuotesLoading,
} from "@/store/slices/quotesSlice";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Edit } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from '@/lib/supabase';

export default function QuoteSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      setIsLoading(true);
      (async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error('No access token found. Please log in.');
        const res = await fetch(`/api/quotes/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        const data = await res.json();
        setQuote(data);
        setIsLoading(false);
      })();
    }
  }, [params.id]);

  const handleDownloadPDF = () => {
    if (!quote) return;

    // Initialize PDF document
    const doc = new jsPDF();

    // Add company header
    doc.setFontSize(20);
    doc.text("Cloud Forge", 14, 20);

    // Add quote details
    doc.setFontSize(12);
    doc.text(`Quote #: ${quote.id}`, 14, 35);
    doc.text(`Date: ${formattedDate}`, 14, 42);
    doc.text(`Customer: ${quote.customer_name}`, 14, 49);

    // Add line items table
    const tableHeaders = [
      ["Material", "Grade", "Dimensions", "Quantity", "Unit Price", "Subtotal"],
    ];
    const tableData = quote.line_items.map((item: any) => [
      item.material_name,
      item.grade,
      item.dimensions,
      item.quantity.toString(),
      `$${item.unit_price?.toFixed(2)}`,
      `$${item.subtotal_price?.toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 60,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    // Add total
    const finalY = (doc as any).lastAutoTable.finalY || 60;
    doc.text(`Total: $${quote.total_price?.toFixed(2)}`, 14, finalY + 10);

    // Add notes if they exist
    if (quote.notes) {
      doc.text("Notes:", 14, finalY + 20);
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(quote.notes, 180);
      doc.text(splitNotes, 14, finalY + 27);
    }

    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 14, pageHeight - 20);
    doc.text("Cloud Forge - Your Trusted Metal Supplier", 14, pageHeight - 15);

    // Download the PDF
    doc.save(`cloud-forge-quote-${quote.id}.pdf`);
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log("Edit quote");
  };

  const handleBack = () => {
    router.push("/build-quote");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Quote not found</h1>
        <Button onClick={handleBack}>Back to Build Quote</Button>
      </div>
    );
  }

  const formattedDate = quote.created_at
    ? format(new Date(quote.created_at), "MMMM d, yyyy")
    : "N/A";

  return (
    <div className="min-h-screen bg-white">
      {/* Header with actions */}
      <div className="bg-gray-100 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Build Quote
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quote content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Quote header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Quote Summary</h1>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Customer</p>
                <p className="font-medium">{quote.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-medium">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Material</th>
                  <th className="text-left py-2">Grade</th>
                  <th className="text-left py-2">Dimensions</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {quote.line_items?.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.material_name}</td>
                    <td className="py-2">{item.grade}</td>
                    <td className="py-2">{item.dimensions}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">
                      ${item.unit_price?.toFixed(2)}
                    </td>
                    <td className="text-right py-2">
                      ${item.subtotal_price?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="text-right py-4 font-bold">
                    Total:
                  </td>
                  <td className="text-right py-4 font-bold">
                    ${quote.total_price?.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div>
              <h2 className="text-xl font-bold mb-2">Notes</h2>
              <p className="text-gray-600">{quote.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

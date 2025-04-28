import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AcceptQuoteModal from './AcceptQuoteModal';

interface QuoteCardProps {
  quote: {
    id: string;
    customer_name: string;
    created_at: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    total_price: number;
    notes?: string;
  };
  onAcceptQuote: (quoteId: string, paymentTerms: string, deliveryTerms: string) => Promise<void>;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  sent: 'bg-blue-100 text-blue-800 border-blue-300',
  accepted: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

const statusLabels = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export default function QuoteCard({ quote, onAcceptQuote }: QuoteCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const formattedDate = format(new Date(quote.created_at), 'MMM d, yyyy');
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(quote.total_price);

  const handleAccept = async (paymentTerms: string, deliveryTerms: string) => {
    try {
      await onAcceptQuote(quote.id, paymentTerms, deliveryTerms);
      toast.success('Quote Accepted', {
        description: 'Sales order and shipment created successfully.',
      });
      setIsModalOpen(false);
      router.push('/sales-orders');
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to accept quote. Please try again.',
      });
    }
  };

  return (
    <>
      <div
        className={`rounded-lg border p-6 shadow-sm transition-all hover:shadow-md ${statusColors[quote.status]} cursor-pointer`}
        onClick={() => router.push(`/quote/${quote.id}`)}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{quote.customer_name}</h3>
            <Badge variant="outline" className={statusColors[quote.status]}>
              {statusLabels[quote.status]}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Created: {formattedDate}
            </p>
            <p className="text-xl font-bold">
              {formattedPrice}
            </p>
            {quote.notes && (
              <p className="text-sm text-gray-600">
                {quote.notes}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={e => {
                e.stopPropagation();
                router.push(`/quote/${quote.id}`);
              }}
            >
              View Quote
            </Button>
            {(quote.status === 'draft' || quote.status === 'sent') && (
              <Button
                onClick={e => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Accept Quote
              </Button>
            )}
          </div>
        </div>
      </div>

      <AcceptQuoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccept={(id, paymentTerms, deliveryTerms) => {
          handleAccept(paymentTerms, deliveryTerms);
        }}
        quote={quote}
      />
    </>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/store";
import QuoteCard from "@/components/ui/QuoteCard";
import { updateQuoteStatus } from "@/app/redux/slices/quotesSlice";
import { supabase } from '@/lib/supabase';

interface Quote {
  id: string;
  customer_name: string;
  created_at: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  total_price: number;
  notes?: string;
  created_by_user_id?: string;
}

export default function QuotesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found. Please log in.');
      const response = await fetch("/api/quotes", {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch quotes");
      }
      const data = await response.json();
      setQuotes(data);
    } catch (err) {
      setError("Failed to load quotes. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string, paymentTerms: string, deliveryTerms: string) => {
    try {
      console.log("[QuotesPage] Received values:");
      console.log("quoteId:", quoteId);
      console.log("paymentTerms:", paymentTerms);
      console.log("deliveryTerms:", deliveryTerms);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found. Please log in.');

      const response = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ payment_terms: paymentTerms, delivery_terms: deliveryTerms }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept quote");
      }

      // Update local state
      setQuotes(
        quotes.map((quote) =>
          quote.id === quoteId ? { ...quote, status: "accepted" } : quote
        )
      );

      // Update Redux store
      dispatch(updateQuoteStatus({ id: quoteId, status: "accepted" }));
    } catch (err) {
      setError("Failed to accept quote. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Quotes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            onAcceptQuote={handleAcceptQuote}
          />
        ))}
      </div>

      {quotes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No quotes found</p>
        </div>
      )}
    </div>
  );
}

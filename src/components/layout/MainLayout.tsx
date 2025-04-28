"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';
import { Settings } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const navigation = [
  { name: 'Inventory', href: '/inventory' },
  { name: 'Build Quote', href: '/build-quote' },
  { name: 'Upload RFQ', href: '/upload-rfq' },
  { name: 'Quotes', href: '/quotes' },
  { name: 'Sales Orders', href: '/sales-orders' },
  { name: 'Shipments', href: '/shipments' },
  { name: 'Invoices', href: '/invoices' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Close dropdown when route changes
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">Cloud Forge</span>
              </div>
              {!(pathname === '/login' || pathname === '/signup') && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                        pathname === item.href
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {!(pathname === '/login' || pathname === '/signup') && (
              <div className="flex items-center relative">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                  onClick={() => setDropdownOpen((open) => !open)}
                >
                  <Settings className="h-6 w-6 text-gray-700" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-16 w-40 bg-white border rounded shadow-lg z-50">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 
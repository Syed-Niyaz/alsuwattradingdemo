import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/auth-context'
import { LangProvider } from '@/context/lang-context'
import { QuotationProvider } from '@/context/quotation-context'
import { CustomerProvider } from '@/context/customer-context'
import { ProductProvider } from '@/context/product-context'
import { NotificationProvider } from '@/context/notification-context'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MELAMINE OrderFlow - Enterprise Sales & Quotation Portal",
  description: "Enterprise quotation and order management platform for MELAMINE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <LangProvider>
            <CustomerProvider>
              <QuotationProvider>
                <ProductProvider>
                  <NotificationProvider>
                    {children}
                  </NotificationProvider>
                </ProductProvider>
              </QuotationProvider>
            </CustomerProvider>
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

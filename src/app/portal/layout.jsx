import React from "react";
import { CustomerSidebar } from "@/components/layout/CustomerSidebar";
import { Navbar } from "@/components/layout/Navbar";
export default function CustomerPortalLayout({ children, }) {
    return (<div className="min-h-screen bg-slate-50/60 flex">
      {/* Sidebar (fixed on desktop) */}
      <CustomerSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64">
        <Navbar mode="customer"/>
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>);
}

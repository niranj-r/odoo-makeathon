import React from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Navbar } from "@/components/layout/Navbar";
export default function AdminLayout({ children, }) {
    return (<div className="min-h-screen bg-slate-50/60 flex">
      {/* Sidebar (fixed on desktop) */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64">
        <Navbar mode="admin"/>
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>);
}

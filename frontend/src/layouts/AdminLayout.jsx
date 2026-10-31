import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import SetupBanner from '../components/common/SetupBanner';

/**
 * AdminLayout
 * Router shell wrapping admin pages with BrightLoop DashboardLayout.
 */
export const AdminLayout = () => {
  return (
    <>
      <SetupBanner />
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </>
  );
};

export default AdminLayout;

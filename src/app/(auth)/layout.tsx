'use client';

import React from 'react';

// This layout is now simplified as the auth pages are integrated into the landing page.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

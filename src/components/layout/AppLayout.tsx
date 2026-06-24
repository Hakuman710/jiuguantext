import { type ReactNode } from 'react';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { ToastContainer } from '../shared/Toast';
import { useAppStore } from '../../stores/app-store';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { toasts, dismissToast } = useAppStore();

  return (
    <div className="h-screen flex overflow-hidden">
      <LeftSidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-cosmic">{children}</main>
      <RightSidebar />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

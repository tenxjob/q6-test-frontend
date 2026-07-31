import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { QueueTable } from './QueueTable';
import { AddQueueModal } from './AddQueueModal';

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function QueuePageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0 0.25rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            จัดการคิว
          </h1>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{
            whiteSpace: 'nowrap',
            padding: '0.7rem 1.35rem',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <span>⚡</span> + เพิ่มรายการจาก Payment Gateway (จำลอง)
        </button>
      </div>

      {/* Queue Table Card */}
      <div className="card" style={{ padding: 0 }}>
        <QueueTable />
      </div>

      {/* Add Queue Modal */}
      <AddQueueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export function QueuePage() {
  const [queryClient] = useState(() => defaultQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors theme="dark" closeButton />
      <QueuePageContent />
    </QueryClientProvider>
  );
}

import { useState, useEffect, useMemo, type SyntheticEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetQueues } from '../../service/apiQueue';

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function CheckQueueContent() {
  const { data: queues, isLoading, isError, refetch } = useGetQueues();
  const [inputCode, setInputCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Persistent hold state
  const [holdQueueIds, setHoldQueueIds] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hold_queue_ids');
      if (saved) {
        try { return JSON.parse(saved); } catch { return {}; }
      }
    }
    return {};
  });

  // Persistent express/shortcut queue state
  const [expressQueueIds, setExpressQueueIds] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('express_queue_ids');
      if (saved) {
        try { return JSON.parse(saved); } catch { return {}; }
      }
    }
    return {};
  });

  // Sync real-time express/hold queue updates from WebSocket custom events
  useEffect(() => {
    const handleExpressChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) setExpressQueueIds(customEvent.detail);
    };
    const handleHoldChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) setHoldQueueIds(customEvent.detail);
    };

    window.addEventListener('express_queue_changed', handleExpressChange);
    window.addEventListener('hold_queue_changed', handleHoldChange);
    return () => {
      window.removeEventListener('express_queue_changed', handleExpressChange);
      window.removeEventListener('hold_queue_changed', handleHoldChange);
    };
  }, []);


  const handleSearch = (e?: SyntheticEvent) => {
    if (e) e.preventDefault();
    setSearchQuery(inputCode.trim());
    setHasSearched(true);
  };

  // Derive searched item directly from live queues data
  const searchedItem = useMemo(() => {
    if (!hasSearched || !searchQuery || !queues) return null;
    const query = searchQuery.toLowerCase();
    return queues.find(q =>
      q.code.toLowerCase() === query ||
      q.name.toLowerCase().includes(query) ||
      q.id.toLowerCase() === query
    ) || null;
  }, [queues, searchQuery, hasSearched]);

  // Sort in-queue items identically to QueueTable (normal first by timestamp, hold items at bottom)
  const sortedInQueueItems = useMemo(() => {
    if (!queues) return [];
    const pendingList = queues.filter(q => q.listStatus === 'pending');
    return pendingList.sort((a, b) => {
      const aKey = a.listQueueId || a.id;
      const bKey = b.listQueueId || b.id;
      const aHold = holdQueueIds[aKey] ? 1 : 0;
      const bHold = holdQueueIds[bKey] ? 1 : 0;
      if (aHold !== bHold) {
        return aHold - bHold; // Normal (0) first, Hold (1) last
      }
      const timeA = a.updateAt ? new Date(a.updateAt).getTime() : (a.listCreatedAt ? new Date(a.listCreatedAt).getTime() : 0);
      const timeB = b.updateAt ? new Date(b.updateAt).getTime() : (b.listCreatedAt ? new Date(b.listCreatedAt).getTime() : 0);
      return timeA - timeB;
    });
  }, [queues, holdQueueIds]);

  // Check if searched item is in express/shortcut mode (confirm button unlocked)
  const searchedQueueKey = searchedItem ? (searchedItem.listQueueId || searchedItem.id) : '';
  const isExpressMode = searchedQueueKey ? !!expressQueueIds[searchedQueueKey] : false;

  // Calculate live order position (If express mode is unlocked, position becomes 1 immediately!)
  const inQueuePosition = searchedItem && searchedItem.listStatus === 'pending'
    ? (isExpressMode ? 1 : sortedInQueueItems.findIndex(q => q.id === searchedItem.id) + 1)
    : null;



  return (
    <div style={{
      maxWidth: '680px',
      margin: '2rem auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      padding: '0 1rem'
    }}>
      {/* Page Title */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          ตรวจสอบสถานะคิว
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
          กรอกรหัสคิวของคุณเพื่อค้นหาและเช็คสถานะการให้บริการล่าสุด
        </p>
      </div>

      {/* Main Search Container Box */}
      <div className="card" style={{
        padding: '2.5rem 2rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '480px', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', position: 'relative' }}>
          <input
            type="text"
            placeholder="ค้นหารหัสคิว (e.g. Q001, Q002)..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            style={{
              flex: '1 1 240px',
              width: '100%',
              padding: '0.85rem 1.5rem',
              fontSize: '1rem',
              borderRadius: '50px',
              border: '2px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              outline: 'none',
              transition: 'border-color var(--transition-fast)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary-red)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{
              flex: '1 1 auto',
              justifyContent: 'center',
              borderRadius: '50px',
              padding: '0.85rem 1.75rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              whiteSpace: 'nowrap',
              backgroundColor: 'var(--primary-red)',
              cursor: 'pointer'
            }}
          >
            🔍 ค้นหา
          </button>
        </form>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          💡 ใส่รหัสคิว เช่น <strong style={{ color: 'var(--primary-red-hover)' }}>Q001</strong> หรือชื่อบริการเพื่อตรวจสอบ
        </p>
      </div>

      {/* Results Section */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary-red)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '0.9rem' }}>กำลังค้นหาข้อมูลคิว...</p>
        </div>
      ) : isError ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <p style={{ color: '#ef4444', fontWeight: 600, margin: 0 }}>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => refetch()}>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : hasSearched && !searchedItem ? (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
            ไม่พบข้อมูลคิวที่ค้นหา
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            ไม่พบรหัสคิว "<strong style={{ color: 'var(--text-main)' }}>{searchQuery}</strong>" ในระบบ กรุณาตรวจสอบรหัสคิวใหม่อีกครั้ง
          </p>
        </div>
      ) : searchedItem ? (
        (() => {
          const isFinished = searchedItem.listStatus === 'finished';
          const isCanceled = searchedItem.listStatus === 'canceled';
          const isInQueue = searchedItem.listStatus === 'pending';
          const isHold = searchedItem.listQueueId ? holdQueueIds[searchedItem.listQueueId] : holdQueueIds[searchedItem.id];

          return (
            <div className="card" style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface)',
              border: isHold ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-md)',
              transition: 'transform var(--transition-fast)'
            }}>
              {/* Header Info: Code & Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    รหัสคิวของคุณ
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-red-hover)', marginTop: '0.25rem' }}>
                    {searchedItem.code}
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {isFinished ? (
                    <span style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      ✓ ให้บริการเสร็จสิ้นแล้ว
                    </span>
                  ) : isCanceled ? (
                    <span style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      ✕ ยกเลิกคิวแล้ว
                    </span>
                  ) : isHold ? (
                    <span style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(249, 115, 22, 0.15)',
                      color: '#f97316',
                      border: '1px solid rgba(249, 115, 22, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      ⚠️ พบปัญหา โปรดติดต่อแอดมิน
                    </span>
                  ) : isInQueue ? (
                    <span style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(234, 179, 8, 0.15)',
                      color: '#eab308',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      ⏱️ อยู่ในคิวรอรับบริการ
                    </span>
                  ) : (
                    <span style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      ⏳ รอดำเนินการ (ยังไม่ถูกส่งเข้าคิว)
                    </span>
                  )}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

              {/* Grid Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ชื่อ</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {searchedItem.name}
                  </div>
                </div>

                {isInQueue && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {isHold ? 'สถานะรายการ' : 'ลำดับคิวในระบบ'}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isHold ? '#f97316' : '#eab308', marginTop: '0.2rem' }}>
                      {isHold ? '⚠️ พบปัญหา โปรดติดต่อแอดมิน' : `ลำดับที่ ${inQueuePosition}`}
                    </div>
                  </div>
                )}

                {isFinished && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ข้อความจากทางร้าน</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#22c55e', marginTop: '0.2rem' }}>
                      🎉 ขอบคุณที่ใช้บริการกับร้าน Supersix
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      ) : null}
    </div>
  );
}

export function CheckQueuePage() {
  const [queryClient] = useState(() => defaultQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <CheckQueueContent />
    </QueryClientProvider>
  );
}

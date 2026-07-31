import { useState, useEffect, useMemo, useRef, type SyntheticEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import { useGetQueues } from '../../service/apiQueue';
import { getFormattedChatUrl } from '../../utils/urlHelper';
import { playChimeSound } from '../../utils/soundHelper';

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
  const [isCopiedUrl, setIsCopiedUrl] = useState(false);

  // Auto-search if ?code= or ?q= parameter is present in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get('code') || params.get('q') || params.get('search');
      if (codeFromUrl && codeFromUrl.trim()) {
        const cleanCode = codeFromUrl.trim();
        setInputCode(cleanCode);
        setSearchQuery(cleanCode);
        setHasSearched(true);
      }
    }
  }, []);

  const handleCopyDirectUrl = (code: string) => {
    if (typeof window === 'undefined') return;
    const directUrl = `${window.location.origin}/check-queue?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(directUrl);
    setIsCopiedUrl(true);
    toast.success(`📋 คัดลอกลิงก์ตรวจสอบคิว (${code}) เรียบร้อยแล้ว`);
    setTimeout(() => {
      setIsCopiedUrl(false);
    }, 2000);
  };

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
      const aHold = a.isHold ? 1 : 0;
      const bHold = b.isHold ? 1 : 0;
      if (aHold !== bHold) {
        return aHold - bHold; // Normal (0) first, Hold (1) last
      }
      const timeA = a.updateAt ? new Date(a.updateAt).getTime() : (a.listCreatedAt ? new Date(a.listCreatedAt).getTime() : 0);
      const timeB = b.updateAt ? new Date(b.updateAt).getTime() : (b.listCreatedAt ? new Date(b.listCreatedAt).getTime() : 0);
      return timeA - timeB;
    });
  }, [queues]);

  // Check if searched item is in express/shortcut mode or hold mode
  const isExpressMode = searchedItem ? !!searchedItem.isExpress : false;
  const isHoldMode = searchedItem ? !!searchedItem.isHold : false;

  // Calculate live order position (If express mode is unlocked, position becomes 1 immediately!)
  const inQueuePosition = searchedItem && searchedItem.listStatus === 'pending'
    ? (isExpressMode ? 1 : sortedInQueueItems.findIndex(q => q.id === searchedItem.id) + 1)
    : null;

  // Track previous rank position and hold status to prevent redundant toasts
  const prevRankRef = useRef<number | null>(null);
  const prevHoldRef = useRef<boolean>(false);

  // Trigger Toast Notification when queue rank reaches 4, 3, 2, 1 OR when queue has a problem
  useEffect(() => {
    if (!searchedItem || searchedItem.listStatus !== 'pending' || inQueuePosition === null) {
      prevRankRef.current = null;
      prevHoldRef.current = false;
      return;
    }

    // 1. If queue has a problem (isHoldMode === true): Notify urgent problem alert instead of queue rank!
    if (isHoldMode) {
      if (!prevHoldRef.current) {
        toast.error('⚠️ พบปัญหาเกี่ยวกับคิวของคุณ!', {
          description: `รหัสคิว ${searchedItem.code} มีปัญหา โปรดติดต่อแอดมินที่แชท ด่วน`,
          duration: 10000,
        });
        playChimeSound('urgent');
        prevHoldRef.current = true;
      }
      prevRankRef.current = null;
      return;
    }

    // Reset hold tracking when hold status is removed
    prevHoldRef.current = false;

    // 2. Normal queue rank notification (4, 3, 2, 1)
    if (prevRankRef.current !== inQueuePosition) {
      if (inQueuePosition === 1) {
        toast.success('🎉 ถึงคิวคุณแล้ว!', {
          description: `รหัสคิว ${searchedItem.code} ถึงคิวแล้ว! กรุณาเข้ารับบริการที่เคาน์เตอร์`,
          duration: 8000,
        });
        playChimeSound('current');
      } else if (inQueuePosition >= 2 && inQueuePosition <= 4) {
        toast.warning(`🔔 ใกล้ถึงคิวคุณแล้ว! (ลำดับที่ ${inQueuePosition})`, {
          description: `รหัสคิว ${searchedItem.code} อีกเพียง ${inQueuePosition - 1} คิวจะถึงคิวของคุณแล้ว กรุณาเตรียมพร้อม`,
          duration: 6000,
        });
        playChimeSound('near');
      }
      prevRankRef.current = inQueuePosition;
    }
  }, [inQueuePosition, searchedItem, isHoldMode]);



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

        {/* Sound Test Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.65rem',
          flexWrap: 'wrap',
          width: '100%',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => {
              playChimeSound('near');
              toast.warning('🔔 ทดสอบเสียง: ใกล้ถึงคิวคุณแล้ว!');
            }}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              color: '#eab308',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'transform var(--transition-fast)'
            }}
          >
            🔊 ทดสอบเสียง "ใกล้ถึงคิว"
          </button>
          <button
            type="button"
            onClick={() => {
              playChimeSound('current');
              toast.success('🎉 ทดสอบเสียง: ถึงคิวคุณแล้ว!');
            }}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'transform var(--transition-fast)'
            }}
          >
            🔊 ทดสอบเสียง "ถึงคิวแล้ว"
          </button>
        </div>
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
          const isHold = !!searchedItem.isHold;

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary-red-hover)', fontFamily: 'monospace' }}>
                      {searchedItem.code}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyDirectUrl(searchedItem.code)}
                      title="คัดลอกลิงก์ตรวจสอบคิวนี้"
                      style={{
                        background: isCopiedUrl ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        border: isCopiedUrl ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        color: isCopiedUrl ? '#22c55e' : 'var(--text-muted)',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      {isCopiedUrl ? '✓ คัดลอกลิงก์แล้ว' : '📋 คัดลอกลิงก์'}
                    </button>
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>รายการ / ช่องทางสนทนา</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span>{searchedItem.name}</span>
                    {searchedItem.channel && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <img
                          src={
                            searchedItem.channel.toLowerCase() === 'facebook'
                              ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXoMFtNYy-gfuvVnQkKSiDAmfYt0ynmaGz55WPNbUPZw&s'
                              : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyPW5ubRuhtFZJy7-9e24kQSydAiPV_RYswFcWxYiHgw&s'
                          }
                          alt={searchedItem.channel}
                          style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontWeight: 600, color: searchedItem.channel.toLowerCase() === 'line' ? '#4ade80' : '#60a5fa' }}>
                          {searchedItem.channel.toLowerCase() === 'line' ? 'Line' : 'Facebook'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                        <a
                          href={getFormattedChatUrl(searchedItem.url, searchedItem.channel, true)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: searchedItem.channel.toLowerCase() === 'line' ? 'rgba(6, 199, 85, 0.2)' : 'rgba(24, 119, 242, 0.2)',
                            color: searchedItem.channel.toLowerCase() === 'line' ? '#4ade80' : '#60a5fa',
                            border: searchedItem.channel.toLowerCase() === 'line' ? '1px solid rgba(6, 199, 85, 0.4)' : '1px solid rgba(24, 119, 242, 0.4)',
                            textDecoration: 'none',
                          }}
                        >
                          เปิดแชท ↗
                        </a>
                      </div>
                    )}
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
      <Toaster position="top-right" richColors theme="dark" closeButton />
      <CheckQueueContent />
    </QueryClientProvider>
  );
}

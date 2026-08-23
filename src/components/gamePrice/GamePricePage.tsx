import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useGetGamePrices, type GamePriceItem } from '../../service/apiGamePrice';
import { ConfigureGamePriceModal } from './ConfigureGamePriceModal';
import { ManageUidPacksModal } from './ManageUidPacksModal';

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function GamePriceContent() {
  const { data: gamePrices = [], isLoading, isError, error, refetch } = useGetGamePrices();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'UID' | 'ID_PASS'>('all');

  // Modals state
  const [selectedIdPassGame, setSelectedIdPassGame] = useState<GamePriceItem | null>(null);
  const [selectedUidGame, setSelectedUidGame] = useState<GamePriceItem | null>(null);

  // Stats
  const stats = useMemo(() => {
    const totalGames = gamePrices.length;
    const configuredGames = gamePrices.filter((g) => g.packs && g.packs.length > 0).length;
    const totalPacks = gamePrices.reduce((acc, g) => acc + (g.packs?.length || 0), 0);
    return { totalGames, configuredGames, totalPacks };
  }, [gamePrices]);

  // Filtered games
  const filteredGames = useMemo(() => {
    return gamePrices.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.code.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (typeFilter !== 'all' && g.type !== typeFilter) return false;
      return true;
    });
  }, [gamePrices, searchTerm, typeFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                margin: 0,
                color: 'var(--text-main)',
                letterSpacing: '-0.5px',
              }}
            >
              🎮 กำหนดราคาเกม (Game Price Management)
            </h1>
          </div>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            เกม <strong>ID_PASS</strong>: กำหนดเรทคูณ USD | เกม <strong>UID</strong>: สร้างแพ็กเกจราคาเฉพาะเกมได้อิสระ
          </p>
        </div>

        <a
          href="/pricebook"
          className="btn-secondary"
          style={{
            padding: '0.7rem 1.25rem',
            fontSize: '0.88rem',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>📖</span> ดูตาราง Pricebook
        </a>
      </div>

      {/* Stats Counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Total Games */}
        <div
          className="card"
          style={{
            padding: '1.15rem 1.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.9) 0%, rgba(39, 39, 42, 0.5) 100%)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              เกมทั้งหมดในระบบ
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {stats.totalGames} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>เกม</span>
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
            }}
          >
            🎮
          </div>
        </div>

        {/* Configured Games */}
        <div
          className="card"
          style={{
            padding: '1.15rem 1.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(20, 83, 45, 0.2) 0%, rgba(24, 24, 27, 0.9) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', color: '#4ade80', fontWeight: 600 }}>
              เกมที่ตั้งราคาแล้ว
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4ade80', marginTop: '0.2rem' }}>
              {stats.configuredGames} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>เกม</span>
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
            }}
          >
            ✓
          </div>
        </div>

        {/* Total Active Packs */}
        <div
          className="card"
          style={{
            padding: '1.15rem 1.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.15) 0%, rgba(24, 24, 27, 0.9) 100%)',
            border: '1px solid rgba(225, 29, 72, 0.3)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', color: '#fda4af', fontWeight: 600 }}>
              แพ็กเกจที่เปิดขายรวม
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-red-hover)', marginTop: '0.2rem' }}>
              {stats.totalPacks} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>แพ็ก</span>
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(225, 29, 72, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
            }}
          >
            📦
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 300px' }}>
          <span
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
              fontSize: '0.9rem',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="ค้นหาชื่อเกม หรือรหัสย่อ (เช่น RoV, VAL)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.6rem 0.9rem 0.6rem 2.4rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Type Filter Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem',
            border: '1px solid var(--border-color)',
          }}
        >
          {(
            [
              { id: 'all', label: 'ทุกประเภท' },
              { id: 'UID', label: '🆔 UID (สร้างราคาเอง)' },
              { id: 'ID_PASS', label: '🔐 ID_PASS (เรท USD)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              style={{
                border: 'none',
                background:
                  typeFilter === tab.id
                    ? tab.id === 'UID'
                      ? 'rgba(6, 182, 212, 0.3)'
                      : tab.id === 'ID_PASS'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'var(--bg-surface-hover)'
                    : 'transparent',
                color:
                  typeFilter === tab.id
                    ? tab.id === 'UID'
                      ? '#22d3ee'
                      : tab.id === 'ID_PASS'
                      ? '#fbbf24'
                      : 'var(--text-main)'
                    : 'var(--text-muted)',
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game Cards Grid */}
      {isLoading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>⏳</div>
          <div>กำลังโหลดข้อมูลราคาเกม...</div>
        </div>
      ) : isError ? (
        <div
          className="card"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ color: '#ef4444', margin: '0 0 0.5rem' }}>เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 1rem' }}>
            {(error as Error)?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'}
          </p>
          <button className="btn-primary" onClick={() => refetch()}>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎮</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
            ไม่พบรายชื่อเกม
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'กรุณาเพิ่มเกมที่หน้า Game ก่อน'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredGames.map((g) => {
            const hasPacks = g.packs && g.packs.length > 0;
            const isUid = g.type === 'UID';

            return (
              <div
                key={g.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.4rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: isUid ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Game Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {g.imageUrl ? (
                      <img
                        src={g.imageUrl}
                        alt={g.name}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: 'var(--radius-md)',
                          objectFit: 'cover',
                          border: '1px solid var(--border-color)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                        }}
                      >
                        🎮
                      </div>
                    )}

                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>
                        {g.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-main)',
                            fontWeight: 700,
                          }}
                        >
                          {g.code}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isUid ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isUid ? '#22d3ee' : '#fbbf24',
                            fontWeight: 700,
                          }}
                        >
                          {isUid ? '🆔 UID' : '🔐 ID_PASS'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Type Badge */}
                  <div
                    style={{
                      backgroundColor: isUid ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      border: isUid ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.35rem 0.65rem',
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {isUid ? 'รูปแบบราคา' : 'เรทคูณราคา'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: isUid ? '#22d3ee' : '#fbbf24',
                      }}
                    >
                      {isUid ? 'สร้างราคาเอง' : `${g.rate} ฿/USD`}
                    </div>
                  </div>
                </div>

                {/* Configured Packs List */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    minHeight: '110px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      📦 แพ็กเกจที่เปิดขาย ({g.packs?.length || 0} แพ็ก):
                    </span>
                  </div>

                  {hasPacks ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '0.45rem',
                        maxHeight: '150px',
                        overflowY: 'auto',
                      }}
                    >
                      {g.packs.map((p) => {
                        return (
                          <div
                            key={p.priceId || p.gamePriceId}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.35rem 0.55rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid var(--border-color)',
                              fontSize: '0.78rem',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color: isUid ? 'var(--text-main)' : '#22d3ee',
                                fontFamily: isUid ? 'inherit' : 'monospace',
                              }}
                            >
                              {isUid ? p.name || 'แพ็กเกจ' : `$${p.usd?.toFixed(2)}`}
                            </span>
                            <span style={{ fontWeight: 800, color: '#4ade80' }}>
                              {p.sellingPrice.toLocaleString()} ฿
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      onClick={() => (isUid ? setSelectedUidGame(g) : setSelectedIdPassGame(g))}
                      style={{
                        padding: '1.25rem',
                        textAlign: 'center',
                        color: 'var(--text-dim)',
                        fontSize: '0.82rem',
                        border: '1px dashed var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      {isUid ? '+ ยังไม่มีแพ็กเกจ (คลิกเพื่อสร้างราคาเอง)' : '+ ยังไม่ได้เลือกแพ็กเกจ (คลิกเพื่อตั้งราคา)'}
                    </div>
                  )}
                </div>

                {/* Footer Action Button */}
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                  {isUid ? (
                    <button
                      className="btn-primary"
                      onClick={() => setSelectedUidGame(g)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        fontSize: '0.88rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: '#0284c7',
                        borderColor: '#0284c7',
                      }}
                    >
                      <span>💎</span>
                      <span>จัดการแพ็กเกจเฉพาะเกม (UID)</span>
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => setSelectedIdPassGame(g)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        fontSize: '0.88rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>⚙️</span>
                      <span>กำหนดแพ็กเกจ & เรท USD</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ConfigureGamePriceModal
        isOpen={Boolean(selectedIdPassGame)}
        gameItem={selectedIdPassGame}
        onClose={() => setSelectedIdPassGame(null)}
      />

      <ManageUidPacksModal
        isOpen={Boolean(selectedUidGame)}
        gameItem={selectedUidGame}
        onClose={() => setSelectedUidGame(null)}
      />
    </div>
  );
}

export function GamePricePage() {
  const [queryClient] = useState(() => defaultQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors theme="dark" closeButton />
      <GamePriceContent />
    </QueryClientProvider>
  );
}

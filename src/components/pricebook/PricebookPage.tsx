import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetGamePrices } from '../../service/apiGamePrice';

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PricebookContent() {
  const { data: gamePrices = [], isLoading, isError, error, refetch } = useGetGamePrices();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'UID' | 'ID_PASS'>('all');
  const [selectedGameId, setSelectedGameId] = useState<string>('all');

  // Filtered games
  const filteredGames = useMemo(() => {
    return gamePrices.filter((g) => {
      if (!g.packs || g.packs.length === 0) return false;

      const matchesSearch =
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.packs.some(
          (p) =>
            (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.usd !== undefined && p.usd !== null && p.usd.toString().includes(searchTerm)) ||
            p.sellingPrice.toString().includes(searchTerm)
        );

      if (!matchesSearch) return false;
      if (typeFilter !== 'all' && g.type !== typeFilter) return false;
      if (selectedGameId !== 'all' && g.id !== selectedGameId) return false;
      return true;
    });
  }, [gamePrices, searchTerm, typeFilter, selectedGameId]);

  const configuredGamesList = useMemo(() => {
    return gamePrices.filter((g) => g.packs && g.packs.length > 0);
  }, [gamePrices]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
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
              📖 ตารางราคาขาย (Pricebook)
            </h1>
          </div>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            รายการราคาแพ็กเกจเติมเกมทั้งหมด รองรับทั้งเรท <strong>ID_PASS</strong> และแพ็กเกจเฉพาะ <strong>UID</strong>
          </p>
        </div>

        <a
          href="/game-price"
          className="btn-primary"
          style={{
            padding: '0.7rem 1.25rem',
            fontSize: '0.88rem',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <span>⚙️</span> จัดการราคาและเรทเกม
        </a>
      </div>

      {/* Controls Bar */}
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
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 260px' }}>
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
            placeholder="ค้นหาชื่อเกม หรือราคาแพ็กเกจ..."
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

        {/* Game Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>เลือกเกม:</span>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">🎮 ทุกเกม ({configuredGamesList.length})</option>
            {configuredGamesList.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.code}) - {g.type}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
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
              { id: 'UID', label: '🆔 UID' },
              { id: 'ID_PASS', label: '🔐 ID_PASS' },
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
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>⏳</div>
          <div>กำลังโหลดตาราง Pricebook...</div>
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
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📖</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
            ยังไม่มีข้อมูลราคาใน Pricebook
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
            {searchTerm || selectedGameId !== 'all' || typeFilter !== 'all'
              ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขค้นหา'
              : 'กรุณาไปที่หน้า Game Price เพื่อกำหนดเรทและเลือกแพ็กเกจของแต่ละเกม'}
          </p>
          <a
            href="/game-price"
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.75rem 1.4rem' }}
          >
            + ไปกำหนดราคาเกม (Game Price)
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredGames.map((g) => {
            const isUid = g.type === 'UID';

            return (
              <div
                key={g.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: isUid ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                {/* Game Header Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {g.imageUrl ? (
                      <img
                        src={g.imageUrl}
                        alt={g.name}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: 'var(--radius-md)',
                          objectFit: 'cover',
                          border: '1px solid var(--border-color)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.6rem',
                        }}
                      >
                        🎮
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          {g.name}
                        </h2>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.15rem 0.55rem',
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
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isUid ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: isUid ? '#22d3ee' : '#fbbf24',
                            fontWeight: 700,
                          }}
                        >
                          {isUid ? '🆔 UID' : '🔐 ID_PASS'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {isUid ? (
                          <span>
                            รูปแบบราคา: <strong style={{ color: '#22d3ee' }}>ราคาเฉพาะเกม UID</strong> | มีทั้งหมด{' '}
                            <strong>{g.packs?.length || 0}</strong> แพ็กเกจ
                          </span>
                        ) : (
                          <span>
                            เรทราคาขาย: <strong style={{ color: 'var(--primary-red)' }}>{g.rate} ฿/USD</strong> | มีทั้งหมด{' '}
                            <strong>{g.packs?.length || 0}</strong> แพ็กเกจ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <a
                    href="/game-price"
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-dim)',
                      textDecoration: 'none',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    ⚙️ จัดการราคาเกมนี้
                  </a>
                </div>

                {/* Table of Packs for this Game */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                        {isUid ? (
                          <>
                            <th style={{ padding: '0.75rem 1.25rem', color: '#22d3ee', fontWeight: 700 }}>
                              ชื่อแพ็กเกจ (Package Name)
                            </th>
                            <th style={{ padding: '0.75rem 1.25rem', color: '#4ade80', fontWeight: 800, textAlign: 'right' }}>
                              ราคาขายจริง (บาท)
                            </th>
                          </>
                        ) : (
                          <>
                            <th style={{ padding: '0.75rem 1.25rem', color: '#22d3ee', fontWeight: 700 }}>
                              ราคาแพค ($USD)
                            </th>
                            <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              ปัดเศษ ($USD)
                            </th>
                            <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              สูตรคำนวณ
                            </th>
                            <th style={{ padding: '0.75rem 1.25rem', color: '#4ade80', fontWeight: 800, textAlign: 'right' }}>
                              ราคาขายจริง (บาท)
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {g.packs.map((p, pIdx) => {
                        return (
                          <tr
                            key={p.priceId || p.gamePriceId || pIdx}
                            style={{
                              borderBottom:
                                pIdx !== g.packs.length - 1 ? '1px solid var(--border-color)' : 'none',
                            }}
                          >
                            {isUid ? (
                              <>
                                <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                  💎 {p.name || 'แพ็กเกจ'}
                                </td>
                                <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                                  <span
                                    style={{
                                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                      border: '1px solid rgba(34, 197, 94, 0.3)',
                                      padding: '0.3rem 0.75rem',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '1.05rem',
                                      fontWeight: 900,
                                      color: '#4ade80',
                                    }}
                                  >
                                    {p.sellingPrice.toLocaleString()} ฿
                                  </span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ padding: '0.75rem 1.25rem' }}>
                                  <span
                                    style={{
                                      backgroundColor: 'rgba(6, 182, 212, 0.12)',
                                      border: '1px solid rgba(6, 182, 212, 0.3)',
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.9rem',
                                      fontWeight: 800,
                                      color: '#22d3ee',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    ${p.usd !== undefined && p.usd !== null ? p.usd.toFixed(2) : '-'}
                                  </span>
                                </td>

                                <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                  ${p.roundedUsd !== undefined && p.roundedUsd !== null ? p.roundedUsd.toFixed(2) : '-'}
                                </td>

                                <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                  {p.roundedUsd ?? 0} × {p.effectiveRate ?? g.rate}
                                </td>

                                <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                                  <span
                                    style={{
                                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                      border: '1px solid rgba(34, 197, 94, 0.3)',
                                      padding: '0.3rem 0.75rem',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '1.05rem',
                                      fontWeight: 900,
                                      color: '#4ade80',
                                    }}
                                  >
                                    {p.sellingPrice.toLocaleString()} ฿
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PricebookPage() {
  const [queryClient] = useState(() => defaultQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <PricebookContent />
    </QueryClientProvider>
  );
}

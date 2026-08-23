import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import {
  useGetPrices,
  useTogglePriceStatus,
  useBulkImportDefaults,
  type PriceItem,
} from '../../service/apiPrice';
import { useGetGamePrices, useCreateUidCustomPack, useDeleteUidCustomPack } from '../../service/apiGamePrice';
import { AddPriceModal } from './AddPriceModal';
import { EditPriceModal } from './EditPriceModal';
import { DeletePriceModal } from './DeletePriceModal';

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PricePageContent() {
  const { data: prices = [], isLoading } = useGetPrices();
  const { data: allGamePrices = [] } = useGetGamePrices();
  const toggleMutation = useTogglePriceStatus();
  const bulkImportMutation = useBulkImportDefaults();
  const createUidPackMutation = useCreateUidCustomPack();
  const deleteUidPackMutation = useDeleteUidCustomPack();

  // Price Category Tab: 'ID_PASS' | 'UID'
  const [priceCategory, setPriceCategory] = useState<'ID_PASS' | 'UID'>('ID_PASS');

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // UID Game selection
  const uidGames = useMemo(() => allGamePrices.filter((g) => g.type === 'UID'), [allGamePrices]);
  const [selectedUidGameId, setSelectedUidGameId] = useState<string>('');

  // New UID Pack inline form state
  const [newUidPackName, setNewUidPackName] = useState('');
  const [newUidPackPrice, setNewUidPackPrice] = useState(100);

  // Set default selected UID game
  const activeUidGameId = selectedUidGameId || (uidGames.length > 0 ? uidGames[0].id : '');

  // Modals state for ID_PASS
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceItem | null>(null);
  const [deletingPrice, setDeletingPrice] = useState<PriceItem | null>(null);

  // ID_PASS prices (where usd is not null)
  const idPassPrices = useMemo(() => prices.filter((p) => p.usd !== null && p.usd !== undefined), [prices]);

  // UID prices (where type === 'UID' and gameId matches activeUidGameId)
  const activeUidGame = useMemo(() => uidGames.find((g) => g.id === activeUidGameId), [uidGames, activeUidGameId]);

  // Statistics
  const stats = useMemo(() => {
    const totalIdPass = idPassPrices.length;
    const totalUidPacks = uidGames.reduce((acc, g) => acc + (g.packs?.length || 0), 0);
    const active = idPassPrices.filter((p) => p.isUse).length;
    const inactive = totalIdPass - active;
    return { totalIdPass, totalUidPacks, active, inactive };
  }, [idPassPrices, uidGames]);

  // Filtered prices for ID_PASS
  const filteredIdPassPrices = useMemo(() => {
    return idPassPrices.filter((p) => {
      const matchesSearch =
        (p.usd !== null && p.usd.toString().includes(searchTerm)) ||
        (p.roundedUsd !== null && p.roundedUsd && p.roundedUsd.toString().includes(searchTerm)) ||
        p.price.toString().includes(searchTerm);

      if (!matchesSearch) return false;
      if (statusFilter === 'active' && !p.isUse) return false;
      if (statusFilter === 'inactive' && p.isUse) return false;
      return true;
    });
  }, [idPassPrices, searchTerm, statusFilter]);

  const handleToggleStatus = (p: PriceItem) => {
    toggleMutation.mutate(
      { id: p.id, isUse: !p.isUse },
      {
        onSuccess: () => {
          toast.success(
            !p.isUse
              ? `เปิดใช้งานเรท $${p.usd?.toFixed(2)} (${p.price.toLocaleString()} ฿) เรียบร้อยแล้ว`
              : `ปิดใช้งานเรท $${p.usd?.toFixed(2)} เรียบร้อยแล้ว`
          );
        },
        onError: (err: any) => {
          toast.error(err?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
        },
      }
    );
  };

  const handleBulkImport = () => {
    if (confirm('ต้องการโหลดชุดเรทราคามาตรฐาน ID_PASS ทั้งหมด 26 รายการ ($0.99 - $64.99) หรือไม่?')) {
      bulkImportMutation.mutate(undefined, {
        onSuccess: (data) => {
          toast.success(`นำเข้าเรทราคามาตรฐาน ${data.length} รายการ เรียบร้อยแล้ว!`);
        },
        onError: (err: any) => {
          toast.error(err?.message || 'เกิดข้อผิดพลาดในการนำเข้าเรทราคา');
        },
      });
    }
  };

  const handleAddUidPack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUidGameId || !newUidPackName.trim()) {
      toast.error('กรุณากรอกชื่อแพ็กเกจ');
      return;
    }

    createUidPackMutation.mutate(
      {
        gameId: activeUidGameId,
        name: newUidPackName.trim(),
        price: Number(newUidPackPrice),
      },
      {
        onSuccess: () => {
          toast.success(`เพิ่มแพ็กเกจ "${newUidPackName}" (${Number(newUidPackPrice).toLocaleString()} ฿) เรียบร้อยแล้ว`);
          setNewUidPackName('');
          setNewUidPackPrice(100);
        },
        onError: (err: any) => {
          toast.error(err?.message || 'เกิดข้อผิดพลาดในการสร้างแพ็กเกจ');
        },
      }
    );
  };

  const handleDeleteUidPack = (priceId: string, packName: string) => {
    deleteUidPackMutation.mutate(priceId, {
      onSuccess: () => {
        toast.success(`ลบแพ็กเกจ "${packName}" สำเร็จ`);
      },
      onError: (err: any) => {
        toast.error(err?.message || 'เกิดข้อผิดพลาดในการลบแพ็กเกจ');
      },
    });
  };

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
              💰 จัดการราคาและเรทแพ็กเกจ (Price Management)
            </h1>
          </div>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            กำหนดเรทราคามาตรฐาน <strong>ID_PASS</strong> ($USD) หรือสร้างแพ็กเกจราคาเฉพาะเกม <strong>UID</strong>
          </p>
        </div>

        {priceCategory === 'ID_PASS' ? (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBulkImport}
              disabled={bulkImportMutation.isPending}
              style={{
                padding: '0.75rem 1.15rem',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
              }}
            >
              <span>⚡</span>
              <span>{bulkImportMutation.isPending ? 'กำลังนำเข้า...' : 'โหลดเรทมาตรฐาน (26 รายการ)'}</span>
            </button>

            <button
              className="btn-primary"
              onClick={() => setIsAddOpen(true)}
              style={{
                padding: '0.75rem 1.35rem',
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <span>＋</span> เพิ่มเรท USD ใหม่
            </button>
          </div>
        ) : (
          <a
            href="/game-price"
            className="btn-primary"
            style={{
              padding: '0.75rem 1.35rem',
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <span>🎮</span> ไปหน้า Game Price
          </a>
        )}
      </div>

      {/* Main Category Tabs: ID_PASS vs UID */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          gap: '0.35rem',
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          onClick={() => setPriceCategory('ID_PASS')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background:
              priceCategory === 'ID_PASS'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%)'
                : 'transparent',
            color: priceCategory === 'ID_PASS' ? '#fbbf24' : 'var(--text-muted)',
            boxShadow: priceCategory === 'ID_PASS' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            borderBottom: priceCategory === 'ID_PASS' ? '2px solid #fbbf24' : 'none',
          }}
        >
          <span>🔐</span>
          <span>เรทราคา ID_PASS (Rate Matrix {stats.totalIdPass} รายการ)</span>
        </button>

        <button
          type="button"
          onClick={() => setPriceCategory('UID')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background:
              priceCategory === 'UID'
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)'
                : 'transparent',
            color: priceCategory === 'UID' ? '#22d3ee' : 'var(--text-muted)',
            boxShadow: priceCategory === 'UID' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            borderBottom: priceCategory === 'UID' ? '2px solid #22d3ee' : 'none',
          }}
        >
          <span>🆔</span>
          <span>ราคาเฉพาะเกม UID ({stats.totalUidPacks} แพ็กเกจ)</span>
        </button>
      </div>

      {/* SECTION 1: ID_PASS RATE MATRIX */}
      {priceCategory === 'ID_PASS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Search & Filter Bar */}
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
                placeholder="ค้นหาเรท USD หรือราคาบาท (เช่น 0.99, 4.99)..."
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
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* Status Tabs */}
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
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'active', label: 'เปิดใช้งาน' },
                    { id: 'inactive', label: 'ปิดใช้งาน' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    style={{
                      border: 'none',
                      background: statusFilter === tab.id ? 'var(--primary-red)' : 'transparent',
                      color: statusFilter === tab.id ? '#ffffff' : 'var(--text-muted)',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.25rem',
                  border: '1px solid var(--border-color)',
                }}
              >
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    border: 'none',
                    background: viewMode === 'table' ? 'var(--bg-surface-hover)' : 'transparent',
                    color: viewMode === 'table' ? 'var(--text-main)' : 'var(--text-dim)',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ☰ ตาราง
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    border: 'none',
                    background: viewMode === 'grid' ? 'var(--bg-surface-hover)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--text-main)' : 'var(--text-dim)',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ⊞ การ์ด
                </button>
              </div>
            </div>
          </div>

          {/* Rate Matrix Table */}
          {isLoading ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              กำลังโหลดเรทราคา...
            </div>
          ) : viewMode === 'table' ? (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem 1.5rem', color: '#22d3ee', fontWeight: 700 }}>
                      ราคาแพคให้เกม ($USD)
                    </th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ปัดเศษ ($USD)
                    </th>
                    <th style={{ padding: '1rem 1.5rem', color: '#4ade80', fontWeight: 700 }}>
                      ราคาแพคให้เกม (บาท)
                    </th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      สถานะ (isUse)
                    </th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIdPassPrices.map((p, idx) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: idx !== filteredIdPassPrices.length - 1 ? '1px solid var(--border-color)' : 'none',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                      }}
                    >
                      <td style={{ padding: '0.9rem 1.5rem' }}>
                        <span
                          style={{
                            backgroundColor: 'rgba(6, 182, 212, 0.12)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            padding: '0.3rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            color: '#22d3ee',
                            fontFamily: 'monospace',
                          }}
                        >
                          ${p.usd?.toFixed(2)}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.5rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        ${(p.roundedUsd ?? Math.round(p.usd || 0)).toFixed(2)}
                      </td>

                      <td style={{ padding: '0.9rem 1.5rem' }}>
                        <span
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.12)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            padding: '0.3rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: '#4ade80',
                            fontFamily: 'monospace',
                          }}
                        >
                          {p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} ฿
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.5rem' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={p.isUse}
                            onChange={() => handleToggleStatus(p)}
                            style={{ display: 'none' }}
                          />
                          <div
                            style={{
                              width: '36px',
                              height: '20px',
                              backgroundColor: p.isUse ? 'var(--primary-red)' : '#3f3f46',
                              borderRadius: '20px',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                width: '14px',
                                height: '14px',
                                backgroundColor: '#ffffff',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '3px',
                                left: p.isUse ? '19px' : '3px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: p.isUse ? '#4ade80' : 'var(--text-dim)' }}>
                            {p.isUse ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                          </span>
                        </label>
                      </td>

                      <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => setEditingPrice(p)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.35rem 0.65rem',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            ✏️ แก้ไข
                          </button>
                          <button
                            onClick={() => setDeletingPrice(p)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.35rem 0.65rem',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            🗑️ ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {filteredIdPassPrices.map((p) => (
                <div key={p.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, color: '#22d3ee' }}>${p.usd?.toFixed(2)} USD</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>ปัด ${(p.roundedUsd ?? Math.round(p.usd || 0)).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>{p.price.toLocaleString()} ฿</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: UID CUSTOM PER-GAME PACKAGES */}
      {priceCategory === 'UID' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Game Selector for UID */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🎮</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  เลือกเกม UID ที่ต้องการจัดการราคา:
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  เกมประเภท UID สามารถสร้างแพ็กเกจและระบุราคาขายเป็นเงินบาทได้โดยตรง
                </div>
              </div>
            </div>

            <select
              value={activeUidGameId}
              onChange={(e) => setSelectedUidGameId(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.95rem',
                fontWeight: 700,
                outline: 'none',
                minWidth: '220px',
              }}
            >
              {uidGames.length === 0 ? (
                <option value="">ไม่มีเกมประเภท UID</option>
              ) : (
                uidGames.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))
              )}
            </select>
          </div>

          {activeUidGame ? (
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Game Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {activeUidGame.imageUrl ? (
                    <img src={activeUidGame.imageUrl} alt={activeUidGame.name} style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🎮</div>
                  )}
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {activeUidGame.name} ({activeUidGame.code})
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: '#22d3ee', marginTop: '0.15rem' }}>
                      🆔 รูปแบบ UID (กำหนดแพ็กเกจเฉพาะเกมนี้)
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  มีทั้งหมด <strong>{activeUidGame.packs?.length || 0}</strong> แพ็กเกจ
                </div>
              </div>

              {/* Add Package Form */}
              <form onSubmit={handleAddUidPack} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    ชื่อแพ็กเกจ <span style={{ color: 'var(--primary-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 500 VP, 1,000 VP, 100 เพชร..."
                    value={newUidPackName}
                    onChange={(e) => setNewUidPackName(e.target.value)}
                    style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    ราคาขาย (บาท) <span style={{ color: 'var(--primary-red)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      placeholder="เช่น 150"
                      value={newUidPackPrice}
                      onChange={(e) => setNewUidPackPrice(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#4ade80', padding: '0.55rem 2rem 0.55rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', fontWeight: 800, outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>฿</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn-primary" disabled={createUidPackMutation.isPending} style={{ padding: '0.55rem 1.25rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>
                    {createUidPackMutation.isPending ? 'กำลังเพิ่ม...' : '＋ เพิ่มแพ็กเกจ'}
                  </button>
                </div>
              </form>

              {/* List of Custom Packages for this UID Game */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>ชื่อแพ็กเกจ</th>
                      <th style={{ padding: '0.75rem 1.25rem', color: '#4ade80', fontWeight: 800 }}>ราคาขายจริง (บาท)</th>
                      <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', textAlign: 'right' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!activeUidGame.packs || activeUidGame.packs.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          ยังไม่มีแพ็กเกจสำหรับเกมนี้ เพิ่มแพ็กเกจแรกด้านบนได้เลย
                        </td>
                      </tr>
                    ) : (
                      activeUidGame.packs.map((p, idx) => (
                        <tr key={p.priceId || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            💎 {p.name}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '1rem', fontWeight: 800, color: '#4ade80' }}>
                              {p.sellingPrice.toLocaleString()} ฿
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteUidPack(p.priceId, p.name || 'แพ็กเกจ')}
                              disabled={deleteUidPackMutation.isPending}
                              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.65rem', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              🗑️ ลบ
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              ยังไม่มีเกมประเภท UID ในระบบ ให้ไปสร้างเกมประเภท UID ที่หน้า Game ก่อน
            </div>
          )}
        </div>
      )}

      {/* Modals for ID_PASS */}
      <AddPriceModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <EditPriceModal isOpen={Boolean(editingPrice)} priceItem={editingPrice} onClose={() => setEditingPrice(null)} />
      <DeletePriceModal isOpen={Boolean(deletingPrice)} priceItem={deletingPrice} onClose={() => setDeletingPrice(null)} />
    </div>
  );
}

export function PricePage() {
  const [queryClient] = useState(() => defaultQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors theme="dark" closeButton />
      <PricePageContent />
    </QueryClientProvider>
  );
}

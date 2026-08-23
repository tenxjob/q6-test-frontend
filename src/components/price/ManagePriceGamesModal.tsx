import { useState, useEffect, useMemo } from 'react';
import { useGetGames } from '../../service/apiGame';
import { useSetPriceGames, type PriceItem } from '../../service/apiPrice';
import { toast } from 'sonner';

interface ManagePriceGamesModalProps {
  isOpen: boolean;
  priceItem: PriceItem | null;
  onClose: () => void;
}

export function ManagePriceGamesModal({ isOpen, priceItem, onClose }: ManagePriceGamesModalProps) {
  const { data: allGames = [], isLoading: isLoadingGames } = useGetGames();
  const setPriceGamesMutation = useSetPriceGames();

  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'UID' | 'ID_PASS'>('all');

  // Initialize selectedGameIds from priceItem
  useEffect(() => {
    if (priceItem) {
      const initialIds = priceItem.games ? priceItem.games.map((g) => g.gameId) : [];
      setSelectedGameIds(initialIds);
      setSearchTerm('');
      setTypeFilter('all');
    }
  }, [priceItem]);

  const filteredGames = useMemo(() => {
    return allGames.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.code.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (typeFilter !== 'all' && (g.type || 'UID') !== typeFilter) return false;
      return true;
    });
  }, [allGames, searchTerm, typeFilter]);

  if (!isOpen || !priceItem) return null;

  const handleToggleGame = (gameId: string) => {
    setSelectedGameIds((prev) =>
      prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredGames.map((g) => g.id);
    const newSet = new Set([...selectedGameIds, ...filteredIds]);
    setSelectedGameIds(Array.from(newSet));
  };

  const handleDeselectAllFiltered = () => {
    const filteredIdSet = new Set(filteredGames.map((g) => g.id));
    setSelectedGameIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
  };

  const handleSave = () => {
    setPriceGamesMutation.mutate(
      {
        priceId: priceItem.id,
        gameIds: selectedGameIds,
      },
      {
        onSuccess: () => {
          toast.success(
            `อัปเดตเกมในกลุ่ม "${priceItem.name}" (${selectedGameIds.length} เกม) เรียบร้อยแล้ว`
          );
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || 'เกิดข้อผิดพลาดในการบันทึกรายชื่อเกม');
        },
      }
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
          padding: '1.75rem',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🎮</span>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                จัดการเกมในกลุ่มราคา: <span style={{ color: 'var(--primary-red)' }}>{priceItem.name}</span>
              </h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              ราคา: <strong style={{ color: '#4ade80' }}>{priceItem.price.toLocaleString()} บาท</strong> | ทุกเกมที่เลือกจะใช้ราคานี้ร่วมกัน
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'var(--text-muted)',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  fontSize: '0.85rem',
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อเกม หรือรหัสย่อ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '0.55rem 0.85rem 0.55rem 2.2rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Type filter */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-main)',
                borderRadius: 'var(--radius-md)',
                padding: '0.2rem',
                border: '1px solid var(--border-color)',
              }}
            >
              {(
                [
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'UID', label: '🆔 UID' },
                  { id: 'ID_PASS', label: '🔐 ID_PASS' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  style={{
                    border: 'none',
                    background: typeFilter === tab.id ? 'var(--bg-surface-hover)' : 'transparent',
                    color: typeFilter === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
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

          {/* Quick Select Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              เลือกแล้ว{' '}
              <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                {selectedGameIds.length}
              </strong>{' '}
              / {allGames.length} เกม
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-red)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                + เลือกทั้งหมดในหน้านี้
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                ยกเลิกทั้งหมดในหน้านี้
              </button>
            </div>
          </div>
        </div>

        {/* Games List (Scrollable) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: '260px',
            maxHeight: '380px',
            paddingRight: '0.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {isLoadingGames ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              กำลังโหลดรายชื่อเกม...
            </div>
          ) : filteredGames.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: 'var(--bg-main)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
              }}
            >
              {searchTerm ? 'ไม่พบเกมที่ค้นหา' : 'ยังไม่มีเกมในระบบ ให้เพิ่มเกมที่หน้า Game ก่อน'}
            </div>
          ) : (
            filteredGames.map((g) => {
              const isSelected = selectedGameIds.includes(g.id);
              const isUid = (g.type || 'UID') === 'UID';

              return (
                <div
                  key={g.id}
                  onClick={() => handleToggleGame(g.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'rgba(225, 29, 72, 0.12)' : 'var(--bg-main)',
                    border: isSelected ? '1px solid var(--primary-red)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleGame(g.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--primary-red)',
                        cursor: 'pointer',
                      }}
                    />

                    {/* Game Avatar */}
                    {g.imageUrl ? (
                      <img
                        src={g.imageUrl}
                        alt={g.name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-sm)',
                          objectFit: 'cover',
                          border: '1px solid var(--border-color)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                        }}
                      >
                        🎮
                      </div>
                    )}

                    {/* Game Info */}
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {g.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1px' }}>
                        รหัส: <strong>{g.code}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        backgroundColor: isUid ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        border: isUid ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                        color: isUid ? '#22d3ee' : '#fbbf24',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {isUid ? '🆔 UID' : '🔐 ID_PASS'}
                    </span>

                    {isSelected && (
                      <span
                        style={{
                          backgroundColor: 'var(--primary-red)',
                          color: '#ffffff',
                          borderRadius: 'var(--radius-full)',
                          padding: '0.15rem 0.55rem',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ ผูกแล้ว
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            เกมในกลุ่มนี้ทั้งหมด: <strong>{selectedGameIds.length}</strong> เกม
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={setPriceGamesMutation.isPending}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={setPriceGamesMutation.isPending}
            >
              {setPriceGamesMutation.isPending ? 'กำลังบันทึก...' : '✓ บันทึกรายชื่อเกม'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

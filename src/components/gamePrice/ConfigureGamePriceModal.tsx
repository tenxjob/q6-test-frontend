import { useState, useEffect, useMemo } from 'react';
import { useGetPrices } from '../../service/apiPrice';
import { useConfigureGamePacks, type GamePriceItem } from '../../service/apiGamePrice';
import { toast } from 'sonner';

interface ConfigureGamePriceModalProps {
  isOpen: boolean;
  gameItem: GamePriceItem | null;
  onClose: () => void;
}

const RATE_PRESETS = [30, 31, 32, 33, 34, 35];

export function ConfigureGamePriceModal({
  isOpen,
  gameItem,
  onClose,
}: ConfigureGamePriceModalProps) {
  const { data: allMasterPrices = [], isLoading: isLoadingPrices } = useGetPrices();
  const configureMutation = useConfigureGamePacks();

  const [rate, setRate] = useState<number>(31);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync state when gameItem opens
  useEffect(() => {
    if (gameItem) {
      setRate(gameItem.rate || 31);
      const existingPackIds = gameItem.packs ? gameItem.packs.map((p) => p.priceId) : [];
      setSelectedPackIds(existingPackIds);
      setSearchTerm('');
    }
  }, [gameItem]);

  const filteredMasterPrices = useMemo(() => {
    return allMasterPrices.filter((p) => {
      if (!p.isUse) return false; // only active master tiers
      if (p.usd === null || p.usd === undefined) return false; // only ID_PASS master tiers with USD
      if (!searchTerm) return true;
      const usdStr = p.usd != null ? p.usd.toString() : '';
      const roundedStr = p.roundedUsd != null ? p.roundedUsd.toString() : '';
      return usdStr.includes(searchTerm) || roundedStr.includes(searchTerm);
    });
  }, [allMasterPrices, searchTerm]);

  if (!isOpen || !gameItem) return null;

  const handleTogglePack = (priceId: string) => {
    setSelectedPackIds((prev) =>
      prev.includes(priceId) ? prev.filter((id) => id !== priceId) : [...prev, priceId]
    );
  };

  const handleSelectAll = () => {
    const allIds = filteredMasterPrices.map((p) => p.id);
    setSelectedPackIds(Array.from(new Set([...selectedPackIds, ...allIds])));
  };

  const handleDeselectAll = () => {
    const filterSet = new Set(filteredMasterPrices.map((p) => p.id));
    setSelectedPackIds((prev) => prev.filter((id) => !filterSet.has(id)));
  };

  const handleSave = () => {
    const rateNum = Number(rate) || 31;
    configureMutation.mutate(
      {
        gameId: gameItem.id,
        rate: rateNum,
        packIds: selectedPackIds,
      },
      {
        onSuccess: () => {
          toast.success(
            `บันทึกแพ็กเกจเกม "${gameItem.name}" (${selectedPackIds.length} แพ็ก, เรท ${rateNum} ฿) สำเร็จ!`
          );
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || 'เกิดข้อผิดพลาดในการบันทึกแพ็กเกจ');
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
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
          maxWidth: '780px',
          maxHeight: '92vh',
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
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {gameItem.imageUrl ? (
              <img
                src={gameItem.imageUrl}
                alt={gameItem.name}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'cover',
                  border: '1px solid var(--border-color)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                }}
              >
                🎮
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {gameItem.name}
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-main)',
                    fontWeight: 700,
                  }}
                >
                  {gameItem.code}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor:
                      gameItem.type === 'UID' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: gameItem.type === 'UID' ? '#22d3ee' : '#fbbf24',
                    fontWeight: 700,
                  }}
                >
                  {gameItem.type}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                กำหนดเรทตัวคูณราคาขาย และเลือกแพ็กเกจ USD ที่เปิดขายในเกมนี้
              </div>
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

        {/* Top Control: Rate Multiplier Input */}
        <div
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '0.25rem',
              }}
            >
              ⚙️ เรทราคาขายต่อ USD (Selling Rate per USD)
            </label>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              สูตรคำนวณ: <span style={{ color: '#4ade80' }}>ราคาขาย (บาท) = ปัดเศษ ($USD) × เรทที่กำหนด</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '130px' }}>
              <input
                type="number"
                step="0.1"
                min="0"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-surface)',
                  border: '2px solid var(--primary-red)',
                  color: '#ffffff',
                  padding: '0.5rem 2.2rem 0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  outline: 'none',
                  textAlign: 'right',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                ฿
              </span>
            </div>

            {/* Quick Rate Presets */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {RATE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setRate(p)}
                  style={{
                    border: '1px solid var(--border-color)',
                    background: rate === p ? 'var(--primary-red)' : 'rgba(255, 255, 255, 0.05)',
                    color: rate === p ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.35rem 0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Select USD Packs */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
              📦 เลือกแพ็กเกจที่จะเปิดขายใน {gameItem.name} (เลือกแล้ว{' '}
              <strong style={{ color: '#4ade80' }}>{selectedPackIds.length}</strong> แพ็ก)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                type="text"
                placeholder="ค้นหาเรท USD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  width: '120px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-red)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                เลือกทั้งหมด
              </button>
              <span style={{ color: 'var(--text-dim)' }}>|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>

          {/* Grid of Packs */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '0.6rem',
              paddingRight: '0.25rem',
              maxHeight: '340px',
            }}
          >
            {isLoadingPrices ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                กำลังโหลดรายการราคา...
              </div>
            ) : filteredMasterPrices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                ไม่พบเรทราคา
              </div>
            ) : (
              filteredMasterPrices.map((p) => {
                const isSelected = selectedPackIds.includes(p.id);
                const usdNum = Number(p.usd) || 0;
                const roundedVal = p.roundedUsd != null ? Number(p.roundedUsd) : Math.round(usdNum);
                const calculatedPrice = Math.round(roundedVal * (Number(rate) || 31));

                return (
                  <div
                    key={p.id}
                    onClick={() => handleTogglePack(p.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'rgba(225, 29, 72, 0.12)' : 'var(--bg-main)',
                      border: isSelected ? '1.5px solid var(--primary-red)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTogglePack(p.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: 'var(--primary-red)',
                            cursor: 'pointer',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            color: '#22d3ee',
                            fontFamily: 'monospace',
                          }}
                        >
                          ${usdNum.toFixed(2)}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        ปัด: ${roundedVal.toFixed(2)}
                      </span>
                    </div>

                    {/* Calculated Price */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginTop: '0.2rem',
                        paddingTop: '0.35rem',
                        borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {roundedVal} × {rate} =
                      </span>
                      <span
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 900,
                          color: isSelected ? '#4ade80' : 'var(--text-muted)',
                        }}
                      >
                        {calculatedPrice.toLocaleString()} ฿
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
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
            สรุป: {gameItem.name} มีทั้งหมด <strong style={{ color: '#4ade80' }}>{selectedPackIds.length}</strong> แพ็ก (เรท {rate} ฿/USD)
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={configureMutation.isPending}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={configureMutation.isPending}
            >
              {configureMutation.isPending ? 'กำลังบันทึก...' : '✓ บันทึกแพ็กเกจและราคาขาย'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

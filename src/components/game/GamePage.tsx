import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import {
  useGetGames,
  useToggleGameStatus,
  type GameItem,
} from '../../service/apiGame';
import { AddGameModal } from './AddGameModal';
import { EditGameModal } from './EditGameModal';
import { DeleteGameModal } from './DeleteGameModal';

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function GamePageContent() {
  const { data: games = [], isLoading, isError, error, refetch } = useGetGames();
  const toggleMutation = useToggleGameStatus();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'UID' | 'ID_PASS'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [deletingGame, setDeletingGame] = useState<GameItem | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = games.length;
    const active = games.filter((g) => g.isUse).length;
    const inactive = total - active;
    const uidCount = games.filter((g) => (g.type || 'UID') === 'UID').length;
    const idPassCount = games.filter((g) => g.type === 'ID_PASS').length;
    return { total, active, inactive, uidCount, idPassCount };
  }, [games]);

  // Filtered games
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.code.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === 'active' && !g.isUse) return false;
      if (statusFilter === 'inactive' && g.isUse) return false;
      if (typeFilter !== 'all' && (g.type || 'UID') !== typeFilter) return false;
      return true;
    });
  }, [games, searchTerm, statusFilter, typeFilter]);

  const handleToggleStatus = (game: GameItem) => {
    toggleMutation.mutate(
      { id: game.id, isUse: !game.isUse },
      {
        onSuccess: () => {
          toast.success(
            !game.isUse
              ? `เปิดใช้งาน "${game.name}" เรียบร้อยแล้ว`
              : `ปิดใช้งาน "${game.name}" เรียบร้อยแล้ว`
          );
        },
        onError: (err: any) => {
          toast.error(err?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
        },
      }
    );
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
              🎮 จัดการรายชื่อเกม (Game Management)
            </h1>
          </div>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            เพิ่ม ลบ แก้ไข กำหนดประเภท (UID / ID_PASS) และเปิด/ปิดการใช้งานเกม
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setIsAddOpen(true)}
          style={{
            padding: '0.75rem 1.4rem',
            fontSize: '0.92rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <span>＋</span> เพิ่มเกมใหม่
        </button>
      </div>

      {/* Stats Counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              เกมทั้งหมด
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {stats.total}
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
            🎲
          </div>
        </div>

        {/* UID Games */}
        <div
          className="card"
          style={{
            padding: '1.15rem 1.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(24, 24, 27, 0.9) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', color: '#22d3ee', fontWeight: 600 }}>
              ประเภท UID
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#22d3ee', marginTop: '0.2rem' }}>
              {stats.uidCount}
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            🆔
          </div>
        </div>

        {/* ID_PASS Games */}
        <div
          className="card"
          style={{
            padding: '1.15rem 1.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(24, 24, 27, 0.9) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 600 }}>
              ประเภท ID_PASS
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
              {stats.idPassCount}
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            🔐
          </div>
        </div>

        {/* Active Games */}
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
              เปิดใช้งาน (Active)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4ade80', marginTop: '0.2rem' }}>
              {stats.active}
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
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
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
        <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 280px' }}>
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
            placeholder="ค้นหาชื่อเกม หรือรหัสย่อ (เช่น VAL)..."
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

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
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
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

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
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
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

          {/* View Mode Toggle */}
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
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
              style={{
                border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-surface-hover)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--text-main)' : 'var(--text-dim)',
                padding: '0.4rem 0.65rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{
                border: 'none',
                background: viewMode === 'table' ? 'var(--bg-surface-hover)' : 'transparent',
                color: viewMode === 'table' ? 'var(--text-main)' : 'var(--text-dim)',
                padding: '0.4rem 0.65rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              ☰ Table
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div
          className="card"
          style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>⏳</div>
          <div>กำลังโหลดข้อมูลเกม...</div>
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
        <div
          className="card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem',
            }}
          >
            🎮
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'ไม่พบเกมที่ตรงกับเงื่อนไข'
              : 'ยังไม่มีข้อมูลเกมในระบบ'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'ลองค้นหาด้วยคำอื่น หรือล้างตัวกรอง'
              : 'เริ่มต้นโดยการเพิ่มเกมแรกของคุณเข้าสู่ระบบ'}
          </p>
          {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
            <button
              className="btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
            >
              ล้างตัวกรอง
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setIsAddOpen(true)}>
              + เพิ่มเกมแรก
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredGames.map((game) => {
            const isUid = (game.type || 'UID') === 'UID';
            return (
              <div
                key={game.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: game.isUse ? '1px solid var(--border-color)' : '1px solid rgba(113, 113, 122, 0.3)',
                  opacity: game.isUse ? 1 : 0.75,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Card Cover Image */}
                <div
                  style={{
                    height: '140px',
                    position: 'relative',
                    backgroundColor: '#18181b',
                    overflow: 'hidden',
                  }}
                >
                  {game.imageUrl ? (
                    <img
                      src={game.imageUrl}
                      alt={game.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #1e1e24 0%, #27272a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                      }}
                    >
                      🎮
                    </div>
                  )}
                  {/* Gradient Shadow Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to top, rgba(20, 20, 23, 0.95) 0%, transparent 60%)',
                    }}
                  />

                  {/* Top Left Badges: Game Code & Type */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.4rem' }}>
                    <div
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {game.code}
                    </div>

                    <div
                      style={{
                        backgroundColor: isUid ? 'rgba(6, 182, 212, 0.85)' : 'rgba(245, 158, 11, 0.85)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: isUid ? '#ffffff' : '#18181b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span>{isUid ? '🆔' : '🔐'}</span>
                      <span>{isUid ? 'UID' : 'ID_PASS'}</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: game.isUse ? 'rgba(34, 197, 94, 0.2)' : 'rgba(113, 113, 122, 0.3)',
                      backdropFilter: 'blur(4px)',
                      border: game.isUse ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(113, 113, 122, 0.4)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: game.isUse ? '#4ade80' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: game.isUse ? '#22c55e' : '#71717a',
                      }}
                    />
                    {game.isUse ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.85rem' }}>
                  <div>
                    <h3
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        margin: '0 0 0.2rem',
                        wordBreak: 'break-word',
                      }}
                    >
                      {game.name}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      เพิ่มเมื่อ: {new Date(game.createdAt).toLocaleDateString('th-TH')}
                    </div>
                  </div>

                  {/* Inline Toggle & Actions */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {/* Status Toggle Switch */}
                    <label
                      title={game.isUse ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: game.isUse ? '#4ade80' : 'var(--text-dim)',
                        fontWeight: 500,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={game.isUse}
                        onChange={() => handleToggleStatus(game)}
                        disabled={toggleMutation.isPending}
                        style={{ display: 'none' }}
                      />
                      <div
                        style={{
                          width: '36px',
                          height: '20px',
                          backgroundColor: game.isUse ? 'var(--primary-red)' : '#3f3f46',
                          borderRadius: '20px',
                          position: 'relative',
                          transition: '0.2s',
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
                            left: game.isUse ? '19px' : '3px',
                            transition: '0.2s',
                          }}
                        />
                      </div>
                      <span>{game.isUse ? 'Active' : 'Inactive'}</span>
                    </label>

                    {/* Edit & Delete Buttons */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => setEditingGame(game)}
                        title="แก้ไขเกม"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.35rem 0.6rem',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                          e.currentTarget.style.borderColor = 'var(--border-light)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                      >
                        ✏️ แก้ไข
                      </button>
                      <button
                        onClick={() => setDeletingGame(game)}
                        title="ลบเกม"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.35rem 0.6rem',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>รูปภาพ</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>ชื่อเกม</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>รหัสย่อ (Code)</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>ประเภท (Type)</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>สถานะ (isUse)</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>วันที่สร้าง</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((game, idx) => {
                const isUid = (game.type || 'UID') === 'UID';
                return (
                  <tr
                    key={game.id}
                    style={{
                      borderBottom: idx !== filteredGames.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Image */}
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      {game.imageUrl ? (
                        <img
                          src={game.imageUrl}
                          alt={game.name}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover',
                            border: '1px solid var(--border-color)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                          }}
                        >
                          🎮
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {game.name}
                    </td>

                    {/* Code */}
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border-color)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                        }}
                      >
                        {game.code}
                      </span>
                    </td>

                    {/* Type */}
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: isUid ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          border: isUid ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                          color: isUid ? '#22d3ee' : '#fbbf24',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        <span>{isUid ? '🆔' : '🔐'}</span>
                        <span>{isUid ? 'UID' : 'ID_PASS'}</span>
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={game.isUse}
                          onChange={() => handleToggleStatus(game)}
                          style={{ display: 'none' }}
                        />
                        <div
                          style={{
                            width: '36px',
                            height: '20px',
                            backgroundColor: game.isUse ? 'var(--primary-red)' : '#3f3f46',
                            borderRadius: '20px',
                            position: 'relative',
                            transition: '0.2s',
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
                              left: game.isUse ? '19px' : '3px',
                              transition: '0.2s',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: game.isUse ? '#4ade80' : 'var(--text-dim)',
                          }}
                        >
                          {game.isUse ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </label>
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {new Date(game.createdAt).toLocaleString('th-TH')}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => setEditingGame(game)}
                          title="แก้ไขเกม"
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
                          onClick={() => setDeletingGame(game)}
                          title="ลบเกม"
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddGameModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <EditGameModal
        isOpen={Boolean(editingGame)}
        game={editingGame}
        onClose={() => setEditingGame(null)}
      />
      <DeleteGameModal
        isOpen={Boolean(deletingGame)}
        game={deletingGame}
        onClose={() => setDeletingGame(null)}
      />
    </div>
  );
}

export function GamePage() {
  const [queryClient] = useState(() => defaultQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors theme="dark" closeButton />
      <GamePageContent />
    </QueryClientProvider>
  );
}

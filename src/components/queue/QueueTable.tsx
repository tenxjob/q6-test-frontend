import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useGetQueues, type QueueItem } from '../../service/apiQueue';
import { useAddToListQueue, useUpdateListQueueStatus, useRemoveFromListQueue, useUpdateListQueueDetails, useToggleListQueueExpress, useToggleListQueueHold } from '../../service/apiListQueue';
import { SendToQueueModal } from './SendToQueueModal';
import { EditQueueModal } from './EditQueueModal';
import { getFormattedChatUrl } from '../../utils/urlHelper';

type FilterType = 'pending_dispatch' | 'in_queue' | 'history';

function CountdownTimer({ updatedAt }: { updatedAt?: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!updatedAt) return;
    const calculateTimeLeft = () => {
      const updatedTime = new Date(updatedAt).getTime();
      const targetTime = updatedTime + 3 * 60 * 1000; // 3 minutes after entry/update
      const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [updatedAt]);

  if (!updatedAt) return <span>-</span>;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpired = timeLeft === 0;

  return (
    <span style={{
      fontFamily: 'monospace',
      fontWeight: 700,
      fontSize: '0.85rem',
      padding: '0.2rem 0.55rem',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
      color: isExpired ? '#ef4444' : '#eab308',
      border: isExpired ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem'
    }}>
      ⏱️ {isExpired ? 'หมดเวลา' : formatted}
    </span>
  );
}

export function QueueTable() {
  const { data: queues, isLoading, isError, error, refetch } = useGetQueues();
  const addToListMutation = useAddToListQueue();
  const updateStatusMutation = useUpdateListQueueStatus();
  const removeFromListMutation = useRemoveFromListQueue();
  const updateDetailsMutation = useUpdateListQueueDetails();
  const toggleExpressMutation = useToggleListQueueExpress();
  const toggleHoldMutation = useToggleListQueueHold();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('pending_dispatch');
  const [addedQueueIds, setAddedQueueIds] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Dispatch modal state
  const [selectedDispatchItem, setSelectedDispatchItem] = useState<QueueItem | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Edit modal state
  const [selectedEditItem, setSelectedEditItem] = useState<QueueItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEditModal = (item: QueueItem) => {
    setSelectedEditItem(item);
    setIsEditModalOpen(true);
  };

  const handleConfirmEdit = ({
    listQueueId,
    channel,
    url,
  }: {
    listQueueId: string;
    channel: string;
    url: string;
  }) => {
    updateDetailsMutation.mutate(
      { id: listQueueId, channel, url },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedEditItem(null);
        },
      }
    );
  };

  const handleOpenDispatchModal = (item: QueueItem) => {
    setSelectedDispatchItem(item);
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = ({
    queueId,
    channel,
    customerName,
    url,
  }: {
    queueId: string;
    channel: string;
    customerName?: string;
    url: string;
  }) => {
    addToListMutation.mutate(
      { queueId, channel, customerName, url },
      {
        onSuccess: () => {
          setAddedQueueIds(prev => ({ ...prev, [queueId]: true }));
          setIsDispatchModalOpen(false);
          setSelectedDispatchItem(null);
          setTimeout(() => {
            setAddedQueueIds(prev => ({ ...prev, [queueId]: false }));
          }, 3000);
        },
      }
    );
  };

  const toggleExpressQueue = (id: string, currentIsExpress: boolean) => {
    toggleExpressMutation.mutate({ id, isExpress: !currentIsExpress });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, []);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(prev => (prev === id ? null : id));
  };

  const toggleHoldQueue = (id: string, currentIsHold: boolean) => {
    toggleHoldMutation.mutate({ id, isHold: !currentIsHold });
  };


  const handleUpdateStatus = (listQueueId: string, status: 'finished' | 'canceled') => {
    updateStatusMutation.mutate({ id: listQueueId, status }, {
      onSuccess: () => {
        if (status === 'finished') {
          toast.success('✓ ให้บริการเสร็จสิ้นเรียบร้อยแล้ว');
        } else {
          toast.error('✕ ยกเลิกรายการคิวแล้ว');
        }
      }
    });
  };

  const handleRemoveQueue = (listQueueId: string) => {
    removeFromListMutation.mutate(listQueueId, {
      onSuccess: () => {
        toast.success('🗑️ ลบรายการเรียบร้อยแล้ว');
      }
    });
  };

  const handleCopyCode = (code: string) => {
    const directUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/check-queue?code=${encodeURIComponent(code)}`
      : `/check-queue?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedCode(code);
    toast.success(`📋 คัดลอกลิงก์ตรวจสอบคิว (${code}) เรียบร้อยแล้ว`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const filteredQueues = queues?.filter(q => {
    // 1. Search term filter
    const matchesSearch =
      q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.code.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Status filter
    if (statusFilter === 'pending_dispatch') {
      return q.listStatus === null || q.listStatus === undefined;
    }
    if (statusFilter === 'in_queue') {
      return q.listStatus === 'pending';
    }
    if (statusFilter === 'history') {
      return q.listStatus === 'finished' || q.listStatus === 'canceled';
    }

    return true;
  });

  // Sorting logic for display
  const displayQueues = useMemo(() => {
    if (!filteredQueues) return [];

    if (statusFilter === 'pending_dispatch') {
      return [...filteredQueues].sort((a, b) => {
        const timeA = a.createAt ? new Date(a.createAt).getTime() : 0;
        const timeB = b.createAt ? new Date(b.createAt).getTime() : 0;
        return timeA - timeB;
      });
    }

    if (statusFilter === 'in_queue') {
      return [...filteredQueues].sort((a, b) => {
        const aHold = a.isHold ? 1 : 0;
        const bHold = b.isHold ? 1 : 0;
        if (aHold !== bHold) {
          return aHold - bHold; // Normal (0) first, Hold (1) last
        }
        const timeA = a.updateAt ? new Date(a.updateAt).getTime() : (a.listCreatedAt ? new Date(a.listCreatedAt).getTime() : 0);
        const timeB = b.updateAt ? new Date(b.updateAt).getTime() : (b.listCreatedAt ? new Date(b.listCreatedAt).getTime() : 0);
        return timeA - timeB;
      });
    }

    return filteredQueues;
  }, [filteredQueues, statusFilter]);

  const pendingDispatchCount = queues?.filter(q => q.listStatus === null || q.listStatus === undefined).length || 0;
  const inQueueCount = queues?.filter(q => q.listStatus === 'pending').length || 0;
  const historyCount = queues?.filter(q => q.listStatus === 'finished' || q.listStatus === 'canceled').length || 0;

  if (isLoading) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{
          width: '28px',
          height: '28px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary-red)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: '0.9rem' }}>กำลังโหลดข้อมูลคิว...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginBottom: '0.5rem', fontWeight: 600 }}>
          เกิดข้อผิดพลาดในการโหลดข้อมูลคิว
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {(error as Error)?.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'}
        </p>
        <button className="btn-secondary" onClick={() => refetch()}>
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Search & Status Filter Controls */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        backgroundColor: 'var(--bg-surface)'
      }}>
        {/* Search Input Box */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px', flex: '1 1 240px' }}>
          <span style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            pointerEvents: 'none'
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="ค้นหาตามชื่อ หรือ รหัสคิว..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.55rem 2.2rem 0.55rem 2.4rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              width: '100%',
              outline: 'none',
              transition: 'all var(--transition-fast)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary-red)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '0.2rem'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setStatusFilter('pending_dispatch')}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: statusFilter === 'pending_dispatch' ? '1px solid var(--primary-red)' : '1px solid var(--border-color)',
              backgroundColor: statusFilter === 'pending_dispatch' ? 'var(--primary-red-muted)' : 'var(--bg-main)',
              color: statusFilter === 'pending_dispatch' ? 'var(--text-main)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            ⏳ รอดำเนินการ ({pendingDispatchCount})
          </button>

          <button
            onClick={() => setStatusFilter('in_queue')}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: statusFilter === 'in_queue' ? '1px solid #eab308' : '1px solid var(--border-color)',
              backgroundColor: statusFilter === 'in_queue' ? 'rgba(234, 179, 8, 0.15)' : 'var(--bg-main)',
              color: statusFilter === 'in_queue' ? '#eab308' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            ⏱️ อยู่ในคิว ({inQueueCount})
          </button>

          <button
            onClick={() => setStatusFilter('history')}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: statusFilter === 'history' ? '1px solid #22c55e' : '1px solid var(--border-color)',
              backgroundColor: statusFilter === 'history' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-main)',
              color: statusFilter === 'history' ? '#22c55e' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            📜 ประวัติคิว ({historyCount})
          </button>
        </div>
      </div>

      {/* Table Content */}
      {!displayQueues || displayQueues.length === 0 ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '0.95rem' }}>
            {searchTerm ? 'ไม่พบข้อมูลคิวตามเงื่อนไขที่เลือก' : 'ไม่มีข้อมูลในหมวดหมู่นี้'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>ลำดับ</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>ชื่อ</th>
                  {statusFilter === 'in_queue' && (
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>ช่องทาง</th>
                  )}
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>รหัสคิว</th>
                  {statusFilter === 'in_queue' && (
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>เวลาในการดำเนินการ</th>
                  )}
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>ราคา</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>เวลา</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>การจัดการ / สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {displayQueues.map((item, index) => {
                  const isFinished = item.listStatus === 'finished';
                  const isCanceled = item.listStatus === 'canceled';
                  const isInQueue = item.listStatus === 'pending';
                  const isAdded = addedQueueIds[item.id];
                  const isCopied = copiedCode === item.code;
                  const queueKey = item.listQueueId || item.id;
                  const isHold = statusFilter === 'in_queue' && !!item.isHold;
                  const isExpress = statusFilter === 'in_queue' && !!item.isExpress;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isExpress
                          ? 'rgba(234, 179, 8, 0.12)'
                          : isHold
                            ? 'rgba(249, 115, 22, 0.06)'
                            : 'transparent',
                        borderLeft: isExpress
                          ? '4px solid #f59e0b'
                          : isHold
                            ? '4px solid #f97316'
                            : '4px solid transparent',
                        transition: 'all var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (
                        e.currentTarget.style.backgroundColor = isExpress
                          ? 'rgba(234, 179, 8, 0.2)'
                          : isHold
                            ? 'rgba(249, 115, 22, 0.12)'
                            : 'var(--bg-surface-hover)'
                      )}
                      onMouseLeave={(e) => (
                        e.currentTarget.style.backgroundColor = isExpress
                          ? 'rgba(234, 179, 8, 0.12)'
                          : isHold
                            ? 'rgba(249, 115, 22, 0.06)'
                            : 'transparent'
                      )}
                    >
                      <td style={{
                        padding: '0.85rem 1.25rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: isExpress ? '#fbbf24' : 'var(--text-main)'
                      }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 500, color: 'var(--text-main)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span>{item.name}</span>
                          {isExpress && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.15rem 0.55rem',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(245, 158, 11, 0.22)',
                              color: '#fbbf24',
                              border: '1px solid rgba(251, 191, 36, 0.5)',
                              boxShadow: '0 0 10px rgba(245, 158, 11, 0.35)',
                              letterSpacing: '0.3px',
                            }}>
                              ⚡ ลัดคิว
                            </span>
                          )}
                        </div>
                      </td>
                      {statusFilter === 'in_queue' && (
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          {item.channel ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <img
                                src={
                                  item.channel.toLowerCase() === 'facebook'
                                    ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXoMFtNYy-gfuvVnQkKSiDAmfYt0ynmaGz55WPNbUPZw&s'
                                    : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyPW5ubRuhtFZJy7-9e24kQSydAiPV_RYswFcWxYiHgw&s'
                                }
                                alt={item.channel}
                                style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <span style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: item.channel.toLowerCase() === 'line' ? '#4ade80' : '#60a5fa'
                              }}>
                                {item.channel.toLowerCase() === 'line' ? 'Line' : 'Facebook'}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                              <a
                                href={getFormattedChatUrl(item.url, item.channel)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  backgroundColor: item.channel.toLowerCase() === 'line' ? 'rgba(6, 199, 85, 0.2)' : 'rgba(24, 119, 242, 0.2)',
                                  color: item.channel.toLowerCase() === 'line' ? '#4ade80' : '#60a5fa',
                                  border: item.channel.toLowerCase() === 'line' ? '1px solid rgba(6, 199, 85, 0.4)' : '1px solid rgba(24, 119, 242, 0.4)',
                                  textDecoration: 'none',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                              >
                                เปิดแชท ↗
                              </a>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ color: 'var(--primary-red-hover)', fontWeight: 600 }}>
                            {item.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(item.code)}
                            title="คัดลอกรหัสคิว"
                            style={{
                              background: isCopied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                              border: isCopied ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-color)',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              color: isCopied ? '#22c55e' : 'var(--text-muted)',
                              transition: 'all var(--transition-fast)'
                            }}
                          >
                            {isCopied ? '✓ คัดลอกแล้ว' : '📋 คัดลอก'}
                          </button>
                        </div>
                      </td>
                      {statusFilter === 'in_queue' && (
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <CountdownTimer updatedAt={item.updateAt || item.listCreatedAt} />
                        </td>
                      )}
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-main)' }}>
                        ฿{item.price.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatDate(item.createAt)}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        {isFinished ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                            color: '#22c55e',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                          }}>
                            ✓ เสร็จสิ้น
                          </span>
                        ) : isCanceled ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            ✕ ยกเลิกแล้ว
                          </span>
                        ) : isInQueue ? (
                          statusFilter === 'in_queue' ? (
                            <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                              {isHold ? (
                                <button
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.75rem',
                                    backgroundColor: 'rgba(234, 179, 8, 0.2)',
                                    color: '#eab308',
                                    border: '1px solid rgba(234, 179, 8, 0.4)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => toggleHoldQueue(queueKey, isHold)}
                                >
                                  🔼 คืนคิว
                                </button>
                              ) : (
                                <>
                                  {(index === 0 || isExpress) && (
                                    <button
                                      style={{
                                        padding: '0.35rem 0.65rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: '#22c55e',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                      disabled={updateStatusMutation.isPending}
                                      onClick={() => item.listQueueId && handleUpdateStatus(item.listQueueId, 'finished')}
                                    >
                                      ✓ ยืนยัน
                                    </button>
                                  )}
                                  <button
                                    style={{
                                      padding: '0.35rem 0.65rem',
                                      fontSize: '0.75rem',
                                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                      color: '#ef4444',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      borderRadius: 'var(--radius-sm)',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                    disabled={updateStatusMutation.isPending}
                                    onClick={() => item.listQueueId && handleUpdateStatus(item.listQueueId, 'canceled')}
                                  >
                                    ✕ ยกเลิก
                                  </button>
                                </>
                              )}

                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  onClick={(e) => toggleMenu(queueKey, e)}
                                  style={{
                                    padding: '0.35rem 0.55rem',
                                    fontSize: '0.85rem',
                                    backgroundColor: openMenuId === queueKey ? 'var(--primary-red-muted)' : 'rgba(255, 255, 255, 0.08)',
                                    color: openMenuId === queueKey ? 'var(--primary-red-hover)' : 'var(--text-main)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    lineHeight: 1
                                  }}
                                  title="ตัวเลือกเพิ่มเติม"
                                >
                                  ⋮
                                </button>

                                {openMenuId === queueKey && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      position: 'absolute',
                                      right: 0,
                                      top: '110%',
                                      zIndex: 100,
                                      backgroundColor: 'var(--bg-surface)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: 'var(--radius-sm)',
                                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                                      minWidth: '150px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      overflow: 'hidden',
                                      padding: '0.3rem 0'
                                    }}
                                  >
                                    {!isHold && index > 0 && (
                                      <button
                                        style={{
                                          padding: '0.5rem 0.85rem',
                                          fontSize: '0.8rem',
                                          textAlign: 'left',
                                          background: 'transparent',
                                          border: 'none',
                                          color: isExpress ? '#eab308' : '#3b82f6',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.4rem',
                                          transition: 'background-color var(--transition-fast)'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          toggleExpressQueue(queueKey, isExpress);
                                        }}
                                      >
                                        {isExpress ? '🔒 ยกเลิกการลัดคิว' : '⚡ ลัดคิว (แสดงปุ่มยืนยัน)'}
                                      </button>
                                    )}

                                    <button
                                      style={{
                                        padding: '0.5rem 0.85rem',
                                        fontSize: '0.8rem',
                                        textAlign: 'left',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        transition: 'background-color var(--transition-fast)'
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        if (item.listQueueId) handleRemoveQueue(item.listQueueId);
                                      }}
                                    >
                                      ↩️ ถอดคิว
                                    </button>

                                    {item.listQueueId && (
                                      <button
                                        style={{
                                          padding: '0.5rem 0.85rem',
                                          fontSize: '0.8rem',
                                          textAlign: 'left',
                                          background: 'transparent',
                                          border: 'none',
                                          color: '#60a5fa',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.4rem',
                                          transition: 'background-color var(--transition-fast)'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          handleOpenEditModal(item);
                                        }}
                                      >
                                        ✏️ แก้ไขช่องทาง / URL
                                      </button>
                                    )}

                                    {!isHold && (
                                      <button
                                        style={{
                                          padding: '0.5rem 0.85rem',
                                          fontSize: '0.8rem',
                                          textAlign: 'left',
                                          background: 'transparent',
                                          border: 'none',
                                          color: '#f97316',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.4rem',
                                          transition: 'background-color var(--transition-fast)'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          toggleHoldQueue(queueKey, isHold);
                                        }}
                                      >
                                        ⚠️ พบปัญหา
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: 'rgba(234, 179, 8, 0.15)',
                              color: '#eab308',
                              border: '1px solid rgba(234, 179, 8, 0.3)'
                            }}>
                              ⏱️ อยู่ในคิว
                            </span>
                          )
                        ) : (
                          <button
                            className="btn-primary"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              backgroundColor: isAdded ? '#22c55e' : 'var(--primary-red)'
                            }}
                            disabled={addToListMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDispatchModal(item);
                            }}
                          >
                            {isAdded ? '✓ ส่งเข้าคิวแล้ว' : '+ ส่งเข้าคิว'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="mobile-card-view">
            {displayQueues.map((item, index) => {
              const isFinished = item.listStatus === 'finished';
              const isCanceled = item.listStatus === 'canceled';
              const isInQueue = item.listStatus === 'pending';
              const isAdded = addedQueueIds[item.id];
              const isCopied = copiedCode === item.code;
              const queueKey = item.listQueueId || item.id;
              const isHold = statusFilter === 'in_queue' && !!item.isHold;
              const isExpress = statusFilter === 'in_queue' && !!item.isExpress;

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: isExpress
                      ? 'rgba(234, 179, 8, 0.12)'
                      : isHold
                        ? 'rgba(249, 115, 22, 0.08)'
                        : 'var(--bg-surface)',
                    border: isExpress
                      ? '1px solid rgba(251, 191, 36, 0.5)'
                      : isHold
                        ? '1px solid rgba(249, 115, 22, 0.4)'
                        : '1px solid var(--border-color)',
                    borderLeft: isExpress ? '4px solid #f59e0b' : isHold ? '4px solid #f97316' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: isExpress ? '0 0 15px rgba(245, 158, 11, 0.2)' : 'var(--shadow-sm)'
                  }}
                >
                  {/* Card Header: Index badge & Code */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        backgroundColor: 'var(--bg-main)',
                        color: isExpress ? '#fbbf24' : 'var(--text-main)',
                        border: '1px solid var(--border-color)'
                      }}>
                        #{index + 1}
                      </span>
                      <span style={{ color: 'var(--primary-red-hover)', fontWeight: 800, fontSize: '1.1rem' }}>
                        {item.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(item.code)}
                        style={{
                          background: isCopied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          border: isCopied ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          color: isCopied ? '#22c55e' : 'var(--text-muted)'
                        }}
                      >
                        {isCopied ? '✓' : '📋'}
                      </button>
                    </div>

                    {/* Status Badge */}
                    {isExpress ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', backgroundColor: 'rgba(245, 158, 11, 0.22)', border: '1px solid rgba(251, 191, 36, 0.5)', padding: '0.25rem 0.65rem', borderRadius: '12px', boxShadow: '0 0 10px rgba(245, 158, 11, 0.35)' }}>⚡ ลัดคิว</span>
                    ) : isFinished ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', padding: '0.25rem 0.65rem', borderRadius: '12px' }}>✓ เสร็จสิ้น</span>
                    ) : isCanceled ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '0.25rem 0.65rem', borderRadius: '12px' }}>✕ ยกเลิก</span>
                    ) : isHold ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.15)', padding: '0.25rem 0.65rem', borderRadius: '12px' }}>⚠️ พบปัญหา</span>
                    ) : isInQueue ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.15)', padding: '0.25rem 0.65rem', borderRadius: '12px' }}>⏱️ อยู่ในคิว</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏳ รอดำเนินการ</span>
                    )}
                  </div>

                  {/* Card Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ชื่อ</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.1rem' }}>
                        {item.name}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ราคา</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.1rem' }}>฿{item.price.toLocaleString()}</div>
                    </div>
                    {statusFilter === 'in_queue' && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>ช่องทาง</div>
                        {item.channel ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <img
                              src={
                                item.channel.toLowerCase() === 'facebook'
                                  ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXoMFtNYy-gfuvVnQkKSiDAmfYt0ynmaGz55WPNbUPZw&s'
                                  : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyPW5ubRuhtFZJy7-9e24kQSydAiPV_RYswFcWxYiHgw&s'
                              }
                              alt={item.channel}
                              style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: item.channel.toLowerCase() === 'line' ? '#4ade80' : '#60a5fa' }}>
                              {item.channel.toLowerCase() === 'line' ? 'Line' : 'Facebook'}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                            <a
                              href={getFormattedChatUrl(item.url, item.channel)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                backgroundColor: item.channel.toLowerCase() === 'line' ? 'rgba(6, 199, 85, 0.2)' : 'rgba(24, 119, 242, 0.2)',
                                color: item.channel.toLowerCase() === 'line' ? '#4ade80' : '#60a5fa',
                                border: item.channel.toLowerCase() === 'line' ? '1px solid rgba(6, 199, 85, 0.4)' : '1px solid rgba(24, 119, 242, 0.4)',
                                textDecoration: 'none',
                              }}
                            >
                              เปิดแชท ↗
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                        )}
                      </div>
                    )}
                    {statusFilter === 'in_queue' && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>เวลาในการดำเนินการ</div>
                        <CountdownTimer updatedAt={item.updateAt || item.listCreatedAt} />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Mobile */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {isInQueue && statusFilter === 'in_queue' ? (
                      isHold ? (
                        <button
                          style={{
                            flex: 1,
                            padding: '0.65rem',
                            fontSize: '0.85rem',
                            backgroundColor: 'rgba(234, 179, 8, 0.2)',
                            color: '#eab308',
                            border: '1px solid rgba(234, 179, 8, 0.4)',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleHoldQueue(queueKey, isHold)}
                        >
                          🔼 คืนคิว
                        </button>
                      ) : (
                        <>
                          {(index === 0 || isExpress) && (
                            <button
                              style={{
                                flex: 1,
                                padding: '0.65rem',
                                fontSize: '0.85rem',
                                backgroundColor: '#22c55e',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              disabled={updateStatusMutation.isPending}
                              onClick={() => item.listQueueId && handleUpdateStatus(item.listQueueId, 'finished')}
                            >
                              ✓ ยืนยัน
                            </button>
                          )}
                          <button
                            style={{
                              flex: 1,
                              padding: '0.65rem',
                              fontSize: '0.85rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            disabled={updateStatusMutation.isPending}
                            onClick={() => item.listQueueId && handleUpdateStatus(item.listQueueId, 'canceled')}
                          >
                            ✕ ยกเลิก
                          </button>
                          {!isHold && index > 0 && (
                            <button
                              style={{
                                padding: '0.65rem 0.85rem',
                                fontSize: '0.85rem',
                                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                color: '#3b82f6',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              onClick={() => toggleExpressQueue(queueKey, isExpress)}
                              title={isExpress ? 'ยกเลิกการลัดคิว' : 'ลัดคิว (แสดงปุ่มยืนยัน)'}
                            >
                              {isExpress ? '🔒' : '⚡'}
                            </button>
                          )}
                          {!isHold && (
                            <button
                              style={{
                                padding: '0.65rem 0.85rem',
                                fontSize: '0.85rem',
                                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                                color: '#f97316',
                                border: '1px solid rgba(249, 115, 22, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              onClick={() => toggleHoldQueue(queueKey, isHold)}
                              title="พบปัญหา"
                            >
                              ⚠️
                            </button>
                          )}
                          <button
                            style={{
                              padding: '0.65rem 0.85rem',
                              fontSize: '0.85rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            onClick={() => item.listQueueId && handleRemoveQueue(item.listQueueId)}
                            title="ถอดคิว"
                          >
                            ↩️
                          </button>
                        </>
                      )
                    ) : !isInQueue && !isFinished && !isCanceled ? (
                      <button
                        className="btn-primary"
                        style={{
                          width: '100%',
                          padding: '0.65rem',
                          fontSize: '0.85rem',
                          backgroundColor: isAdded ? '#22c55e' : 'var(--primary-red)'
                        }}
                        disabled={addToListMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDispatchModal(item);
                        }}
                      >
                        {isAdded ? '✓ ส่งเข้าคิวแล้ว' : '+ ส่งเข้าคิว'}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Dispatch Modal Popup */}
      <SendToQueueModal
        isOpen={isDispatchModalOpen}
        item={selectedDispatchItem}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setSelectedDispatchItem(null);
        }}
        onConfirm={handleConfirmDispatch}
        isPending={addToListMutation.isPending}
      />

      {/* Edit Channel/URL Modal Popup */}
      <EditQueueModal
        isOpen={isEditModalOpen}
        item={selectedEditItem}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEditItem(null);
        }}
        onConfirm={handleConfirmEdit}
        isPending={updateDetailsMutation.isPending}
      />
    </div>
  );
}

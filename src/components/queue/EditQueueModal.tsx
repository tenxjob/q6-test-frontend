import React, { useState, useEffect } from 'react';
import type { QueueItem } from '../../service/apiQueue';

interface EditQueueModalProps {
  isOpen: boolean;
  item: QueueItem | null;
  onClose: () => void;
  onConfirm: (data: { listQueueId: string; channel: string; url: string }) => void;
  isPending: boolean;
}

export function EditQueueModal({
  isOpen,
  item,
  onClose,
  onConfirm,
  isPending,
}: EditQueueModalProps) {
  const [channel, setChannel] = useState<'facebook' | 'line'>('facebook');
  const [url, setUrl] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');

  useEffect(() => {
    if (item) {
      setUrl(item.url || '');
      setChannel((item.channel as 'facebook' | 'line') || 'facebook');
      setErrorText('');
    }
  }, [item]);

  if (!isOpen || !item || !item.listQueueId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !item.listQueueId) return;

    let trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setErrorText('กรุณากรอกหรือแนบ URL สนทนา/Inbox');
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    setErrorText('');
    onConfirm({
      listQueueId: item.listQueueId,
      channel,
      url: trimmedUrl,
    });
  };

  const getPlaceholder = () => {
    if (channel === 'facebook') {
      return 'https://business.facebook.com/latest/inbox/all/?asset_id=...';
    }
    return 'https://chat.line.biz/... หรือ URL ลิงก์แชท';
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
        zIndex: 99999,
        backdropFilter: 'blur(8px)',
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#161922',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          padding: '1.75rem',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✏️</span> แก้ไขช่องทาง / URL
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span>รหัสคิว: <strong style={{ color: '#ef4444', fontFamily: 'monospace' }}>{item.code}</strong></span>
              <span>•</span>
              <span style={{ color: '#cbd5e1' }}>{item.name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              fontSize: '1.1rem',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Channel Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.6rem' }}>
              เลือกช่องทาง <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Facebook Option */}
              <button
                type="button"
                onClick={() => {
                  setChannel('facebook');
                  setErrorText('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: channel === 'facebook' ? '2px solid #1877F2' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: channel === 'facebook' ? 'rgba(24, 119, 242, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: channel === 'facebook' ? '#60a5fa' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: channel === 'facebook' ? '0 0 14px rgba(24, 119, 242, 0.35)' : 'none',
                }}
              >
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXoMFtNYy-gfuvVnQkKSiDAmfYt0ynmaGz55WPNbUPZw&s"
                  alt="Facebook"
                  style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                />
                Facebook
              </button>

              {/* LINE Option */}
              <button
                type="button"
                onClick={() => {
                  setChannel('line');
                  setErrorText('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: channel === 'line' ? '2px solid #06C755' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: channel === 'line' ? 'rgba(6, 199, 85, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: channel === 'line' ? '#4ade80' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: channel === 'line' ? '0 0 14px rgba(6, 199, 85, 0.35)' : 'none',
                }}
              >
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyPW5ubRuhtFZJy7-9e24kQSydAiPV_RYswFcWxYiHgw&s"
                  alt="LINE"
                  style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                />
                LINE
              </button>
            </div>
          </div>

          {/* URL Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              แนบ URL สนทนา / Inbox <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '0.9rem',
                }}
              >
                🔗
              </span>
              <input
                type="text"
                placeholder={getPlaceholder()}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setErrorText('');
                }}
                required
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: errorText ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  padding: '0.7rem 0.9rem 0.7rem 2.4rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = channel === 'facebook' ? '#1877F2' : '#06C755')}
                onBlur={(e) => (e.target.style.borderColor = errorText ? '#ef4444' : 'rgba(255, 255, 255, 0.15)')}
              />
            </div>
            {errorText ? (
              <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                ⚠️ {errorText}
              </span>
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                💡 แก้ไขลิงก์หน้า Inbox หรือแชทเพื่อเปิดสนทนากับลูกค้า
              </span>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isPending}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '10px',
                fontSize: '0.875rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isPending || !url.trim()}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: url.trim() ? '#2563eb' : '#475569',
                color: '#ffffff',
                border: 'none',
                cursor: isPending || !url.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isPending ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

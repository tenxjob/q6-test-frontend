import React, { useState, useEffect } from 'react';
import type { QueueItem } from '../../service/apiQueue';

interface SendToQueueModalProps {
  isOpen: boolean;
  item: QueueItem | null;
  onClose: () => void;
  onConfirm: (data: { queueId: string; channel: string; customerName?: string; url: string }) => void;
  isPending: boolean;
}

export function SendToQueueModal({
  isOpen,
  item,
  onClose,
  onConfirm,
  isPending,
}: SendToQueueModalProps) {
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

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setErrorText('กรุณากรอกหรือแนบ URL สนทนา/Inbox');
      return;
    }

    // Auto-fix URL if user forgets http:// or https://
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    setErrorText('');
    onConfirm({
      queueId: item.id,
      channel,
      customerName: item.name,
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
              <span>🚀</span> ส่งรายการเข้าคิว
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63h-2.425v1.125h2.425c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-3.056c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63h3.056c.349 0 .63.285.63.63 0 .346-.281.63-.63.63h-2.425v1.125h2.425zm-6.155 3.015c0 .265-.164.5-.41.589-.082.03-.168.044-.254.044-.176 0-.349-.074-.472-.204l-2.072-2.753v2.324c0 .345-.281.629-.63.629-.345 0-.63-.284-.63-.629V8.108c0-.266.164-.501.41-.59.082-.029.168-.043.254-.043.176 0 .348.074.472.203l2.072 2.754V8.108c0-.345.281-.63.63-.63.345 0 .63.285.63.63v4.77zm-6.732-2.613H4.053V8.108c0-.345-.282-.63-.63-.63s-.63.285-.63.63v4.77c0 .344.282.629.63.629h3.05c.349 0 .63-.285.63-.629 0-.346-.281-.63-.63-.63zm8.995-6.953C7.039 3.312 0 7.844 0 13.435c0 5.011 5.574 9.189 12.091 9.805.471.051.815.345.753.816-.07.525-.452 2.062-.497 2.378-.061.431.196.426.417.279.165-.11 4.542-3.1 6.202-4.225 3.42-2.07 5.034-4.819 5.034-8.868 0-5.591-7.039-10.123-15.522-10.123z"/>
                </svg>
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
                💡 วางลิงก์หน้า Inbox หรือแชทเพื่อกดเปิดสนทนากับลูกค้าได้ทันทีจากตาราง
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
                backgroundColor: url.trim() ? 'var(--primary-red)' : '#475569',
                color: '#ffffff',
                border: 'none',
                cursor: isPending || !url.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isPending ? 'กำลังบันทึก...' : '✓ ยืนยันส่งเข้าคิว'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

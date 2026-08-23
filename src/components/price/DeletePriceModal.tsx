import { useDeletePrice, type PriceItem } from '../../service/apiPrice';
import { toast } from 'sonner';

interface DeletePriceModalProps {
  isOpen: boolean;
  priceItem: PriceItem | null;
  onClose: () => void;
}

export function DeletePriceModal({ isOpen, priceItem, onClose }: DeletePriceModalProps) {
  const deleteMutation = useDeletePrice();

  if (!isOpen || !priceItem) return null;

  const handleConfirm = () => {
    deleteMutation.mutate(priceItem.id, {
      onSuccess: () => {
        toast.success(`ลบกลุ่มราคา "${priceItem.name}" สำเร็จ`);
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.message || 'เกิดข้อผิดพลาดในการลบกลุ่มราคา');
      },
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(6px)',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          padding: '1.75rem',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            margin: '0 auto 1.2rem',
          }}
        >
          🗑️
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
          ยืนยันการลบกลุ่มราคา?
        </h3>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
          คุณต้องการลบราคา <strong style={{ color: 'var(--text-main)' }}>"{priceItem.name}"</strong> ({priceItem.price.toLocaleString()} ฿) ใช่หรือไม่?
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            style={{ flex: 1, padding: '0.65rem 1rem' }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            style={{
              flex: 1,
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              padding: '0.65rem 1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
              transition: 'all var(--transition-fast)',
            }}
          >
            {deleteMutation.isPending ? 'กำลังลบ...' : 'ยืนยันลบ'}
          </button>
        </div>
      </div>
    </div>
  );
}

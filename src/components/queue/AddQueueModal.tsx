import { useForm } from 'react-hook-form';
import { nanoid } from 'nanoid';
import { useCreateQueue } from '../../service/apiQueue';

interface QueueFormData {
  name: string;
  price: number;
}

interface AddQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddQueueModal({ isOpen, onClose }: AddQueueModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QueueFormData>();

  const createMutation = useCreateQueue();

  if (!isOpen) return null;

  const onSubmit = (data: QueueFormData) => {
    // Auto-generate queue code using nanoid (e.g. Q-A1B2C3)
    const generatedCode = `Q-${nanoid(6).toUpperCase()}`;

    createMutation.mutate(
      {
        name: data.name.trim(),
        price: Number(data.price),
        code: generatedCode,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      padding: '1rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            + เพิ่มคิวใหม่
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.2rem 0.5rem'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              ชื่อคิว / บริการ <span style={{ color: 'var(--primary-red)' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น คิวตรวจโรคทั่วไป A1"
              {...register('name', { required: 'กรุณากรอกชื่อคิว/บริการ' })}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-main)',
                border: errors.name ? '1px solid #ef4444' : '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            {errors.name && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.name.message}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              ราคา (บาท) <span style={{ color: 'var(--primary-red)' }}>*</span>
            </label>
            <input
              type="number"
              placeholder="เช่น 150"
              {...register('price', {
                required: 'กรุณากรอกราคา',
                valueAsNumber: true,
                min: { value: 0, message: 'ราคาต้องไม่ติดลบ' }
              })}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-main)',
                border: errors.price ? '1px solid #ef4444' : '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            {errors.price && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.price.message}
              </span>
            )}
          </div>

          {createMutation.isError && (
            <div style={{
              padding: '0.6rem 0.85rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#ef4444',
              fontSize: '0.85rem',
            }}>
              {(createMutation.error as Error)?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

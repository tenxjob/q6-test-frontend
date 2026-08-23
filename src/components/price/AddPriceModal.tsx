import { useForm } from 'react-hook-form';
import { useCreatePrice, type CreatePriceInput } from '../../service/apiPrice';
import { toast } from 'sonner';

interface AddPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPriceModal({ isOpen, onClose }: AddPriceModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreatePriceInput>({
    defaultValues: {
      usd: 0.99,
      roundedUsd: 1.0,
      price: 39,
      isUse: true,
    },
  });

  const createMutation = useCreatePrice();

  if (!isOpen) return null;

  const handleUsdChange = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setValue('roundedUsd', Math.round(num));
    }
  };

  const onSubmit = (data: CreatePriceInput) => {
    const usd = Number(data.usd);
    const roundedUsd = data.roundedUsd ? Number(data.roundedUsd) : Math.round(usd);
    const price = Number(data.price);

    createMutation.mutate(
      {
        name: `$${usd.toFixed(2)}`,
        usd,
        roundedUsd,
        price,
        isUse: Boolean(data.isUse),
      },
      {
        onSuccess: () => {
          toast.success(`เพิ่มเรทราคา $${usd.toFixed(2)} (${price.toLocaleString()} ฿) เรียบร้อยแล้ว`);
          reset();
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || 'เกิดข้อผิดพลาดในการสร้างเรทราคา');
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
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
      onClick={handleClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          padding: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.3rem' }}>💵</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              เพิ่มเรทราคาใหม่
            </h2>
          </div>
          <button
            onClick={handleClose}
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

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* USD Rate */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              ราคาแพคให้เกม ($USD) <span style={{ color: 'var(--primary-red)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.01"
                placeholder="เช่น 0.99, 4.99, 19.99"
                {...register('usd', {
                  required: 'กรุณากรอกราคา USD',
                  valueAsNumber: true,
                  min: { value: 0, message: 'ราคาต้องมากกว่าหรือเท่ากับ 0' },
                  onChange: (e) => handleUsdChange(e.target.value),
                })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-main)',
                  border: errors.usd ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '0.65rem 2rem 0.65rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                $
              </span>
            </div>
            {errors.usd && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.usd.message}
              </span>
            )}
          </div>

          {/* Rounded USD */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              ปัดเศษ ($USD)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.01"
                placeholder="เช่น 1.00, 5.00, 20.00"
                {...register('roundedUsd', {
                  valueAsNumber: true,
                })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '0.65rem 2rem 0.65rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                $
              </span>
            </div>
          </div>

          {/* THB Price */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              ราคาแพคให้เกม (บาท) <span style={{ color: 'var(--primary-red)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.01"
                placeholder="เช่น 39.00, 179.00, 729.00"
                {...register('price', {
                  required: 'กรุณากรอกราคาเงินบาท',
                  valueAsNumber: true,
                  min: { value: 0, message: 'ราคาต้องไม่ต่ำกว่า 0' },
                })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-main)',
                  border: errors.price ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  color: '#4ade80',
                  padding: '0.65rem 2.2rem 0.65rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  outline: 'none',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                ฿
              </span>
            </div>
            {errors.price && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.price.message}
              </span>
            )}
          </div>

          {/* Status Toggle (isUse) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                สถานะเปิดใช้งาน (isUse)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                เปิดให้สามารถเลือกใช้เรทราคานี้ได้
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                {...register('isUse')}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: watch('isUse') ? 'var(--primary-red)' : '#3f3f46',
                  borderRadius: '26px',
                  transition: '0.2s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '20px',
                    width: '20px',
                    left: watch('isUse') ? '23px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.2s',
                  }}
                />
              </span>
            </label>
          </div>

          {/* Action Buttons */}
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
              {createMutation.isPending ? 'กำลังบันทึก...' : '✓ บันทึกเรทราคา'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

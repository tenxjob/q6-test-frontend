import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateGame, type GameItem, type UpdateGameInput } from '../../service/apiGame';
import { toast } from 'sonner';

interface EditGameModalProps {
  isOpen: boolean;
  game: GameItem | null;
  onClose: () => void;
}

export function EditGameModal({ isOpen, game, onClose }: EditGameModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateGameInput>();

  const [previewError, setPreviewError] = useState(false);
  const updateMutation = useUpdateGame();
  const watchedImageUrl = watch('imageUrl');
  const selectedType = watch('type') || 'UID';

  useEffect(() => {
    if (game) {
      reset({
        name: game.name,
        code: game.code,
        type: game.type || 'UID',
        imageUrl: game.imageUrl || '',
        isUse: game.isUse,
      });
      setPreviewError(false);
    }
  }, [game, reset]);

  if (!isOpen || !game) return null;

  const onSubmit = (data: UpdateGameInput) => {
    updateMutation.mutate(
      {
        id: game.id,
        data: {
          name: data.name?.trim(),
          code: data.code?.trim().toUpperCase(),
          type: data.type || 'UID',
          imageUrl: data.imageUrl ? data.imageUrl.trim() : null,
          isUse: Boolean(data.isUse),
        },
      },
      {
        onSuccess: () => {
          toast.success(`อัปเดตเกม "${data.name}" เรียบร้อยแล้ว`);
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || 'เกิดข้อผิดพลาดในการอัปเดตเกม');
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
          maxWidth: '520px',
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
            <span style={{ fontSize: '1.3rem', color: 'var(--primary-red)' }}>✏️</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              แก้ไขข้อมูลเกม
            </h2>
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

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Game Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              ชื่อเกม <span style={{ color: 'var(--primary-red)' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น Valorant, RoV"
              {...register('name', { required: 'กรุณากรอกชื่อเกม' })}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-main)',
                border: errors.name ? '1px solid #ef4444' : '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            {errors.name && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Game Code */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              รหัสย่อเกม (Code) <span style={{ color: 'var(--primary-red)' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น VAL, ROV"
              {...register('code', {
                required: 'กรุณากรอกรหัสย่อเกม',
                setValueAs: (v) => v.toUpperCase(),
              })}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-main)',
                border: errors.code ? '1px solid #ef4444' : '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                outline: 'none',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            />
            {errors.code && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.code.message}
              </span>
            )}
          </div>

          {/* Game Type (UID / ID_PASS) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
              ประเภทเกม (Type) <span style={{ color: 'var(--primary-red)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setValue('type', 'UID')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: selectedType === 'UID' ? '1.5px solid #06b6d4' : '1px solid var(--border-color)',
                  backgroundColor: selectedType === 'UID' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-main)',
                  color: selectedType === 'UID' ? '#22d3ee' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🆔</span> UID
              </button>

              <button
                type="button"
                onClick={() => setValue('type', 'ID_PASS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: selectedType === 'ID_PASS' ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                  backgroundColor: selectedType === 'ID_PASS' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-main)',
                  color: selectedType === 'ID_PASS' ? '#fbbf24' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🔐</span> ID_PASS
              </button>
            </div>
            <input type="hidden" {...register('type')} />
          </div>

          {/* Image URL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              ลิงก์รูปภาพปก/โลโก้ (Image URL)
            </label>
            <input
              type="url"
              placeholder="https://example.com/cover.png"
              {...register('imageUrl')}
              onChange={() => setPreviewError(false)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Live Preview */}
          {watchedImageUrl && !previewError && (
            <div style={{
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <img
                src={watchedImageUrl}
                alt="Preview"
                onError={() => setPreviewError(true)}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'cover',
                  border: '1px solid var(--border-light)',
                }}
              />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ color: '#4ade80', fontWeight: 600 }}>✓ รูปภาพแสดงผลได้ถูกต้อง</div>
                <div style={{ fontSize: '0.75rem', marginTop: '2px', wordBreak: 'break-all', maxWidth: '340px' }}>
                  {watchedImageUrl}
                </div>
              </div>
            </div>
          )}

          {/* Status Toggle (isUse) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                สถานะเปิดใช้งาน (isUse)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                เปิดให้สามารถเลือกเกมนี้ในระบบจัดการคิว
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
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'กำลังบันทึก...' : '✓ บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

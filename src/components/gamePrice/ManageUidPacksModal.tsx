import { useForm } from 'react-hook-form';
import {
  useCreateUidCustomPack,
  useDeleteUidCustomPack,
  type GamePriceItem,
} from '../../service/apiGamePrice';
import { toast } from 'sonner';

interface ManageUidPacksModalProps {
  isOpen: boolean;
  gameItem: GamePriceItem | null;
  onClose: () => void;
}

interface NewPackForm {
  name: string;
  price: number;
}

export function ManageUidPacksModal({ isOpen, gameItem, onClose }: ManageUidPacksModalProps) {
  const createMutation = useCreateUidCustomPack();
  const deleteMutation = useDeleteUidCustomPack();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewPackForm>({
    defaultValues: {
      name: '',
      price: 100,
    },
  });

  if (!isOpen || !gameItem) return null;

  const onAddPack = (data: NewPackForm) => {
    createMutation.mutate(
      {
        gameId: gameItem.id,
        name: data.name.trim(),
        price: Number(data.price),
      },
      {
        onSuccess: () => {
          toast.success(`เพิ่มแพ็กเกจ "${data.name}" (${Number(data.price).toLocaleString()} ฿) เรียบร้อยแล้ว`);
          reset({ name: '', price: 100 });
        },
        onError: (err: any) => {
          toast.error(err?.message || 'เกิดข้อผิดพลาดในการเพิ่มแพ็กเกจ');
        },
      }
    );
  };

  const handleDeletePack = (priceId: string, packName: string) => {
    deleteMutation.mutate(priceId, {
      onSuccess: () => {
        toast.success(`ลบแพ็กเกจ "${packName}" สำเร็จ`);
      },
      onError: (err: any) => {
        toast.error(err?.message || 'เกิดข้อผิดพลาดในการลบแพ็กเกจ');
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
          maxWidth: '560px',
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
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {gameItem.name}
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                    color: '#22d3ee',
                    fontWeight: 700,
                  }}
                >
                  🆔 UID
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                สร้างและจัดการแพ็กเกจราคาเฉพาะสำหรับเกมนี้
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

        {/* Add New Package Form */}
        <form
          onSubmit={handleSubmit(onAddPack)}
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            ➕ เพิ่มแพ็กเกจใหม่สำหรับ {gameItem.name}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Package Name */}
            <div style={{ flex: '1 1 200px' }}>
              <input
                type="text"
                placeholder="ชื่อแพ็กเกจ เช่น 500 VP, 100 เพชร..."
                {...register('name', { required: 'กรุณากรอกชื่อแพ็กเกจ' })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-surface)',
                  border: errors.name ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
              {errors.name && (
                <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* Price (THB) */}
            <div style={{ position: 'relative', width: '130px' }}>
              <input
                type="number"
                step="0.01"
                placeholder="ราคา (บาท)"
                {...register('price', {
                  required: 'กรุณากรอกราคา',
                  valueAsNumber: true,
                  min: { value: 0, message: 'ราคาต้องไม่ต่ำกว่า 0' },
                })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-surface)',
                  border: errors.price ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  color: '#4ade80',
                  padding: '0.55rem 2rem 0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  outline: 'none',
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

            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending}
              style={{
                padding: '0.55rem 1.1rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {createMutation.isPending ? '...' : '+ เพิ่ม'}
            </button>
          </div>
        </form>

        {/* Existing Custom Packages List */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            📦 รายการแพ็กเกจที่มีอยู่ ({gameItem.packs?.length || 0} รายการ):
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxHeight: '280px',
              paddingRight: '0.25rem',
            }}
          >
            {!gameItem.packs || gameItem.packs.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.88rem',
                }}
              >
                ยังไม่มีแพ็กเกจสำหรับเกมนี้ เพิ่มแพ็กเกจแรกด้านบนได้เลย
              </div>
            ) : (
              gameItem.packs.map((p) => {
                return (
                  <div
                    key={p.priceId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.9rem',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>💎</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {p.name || 'แพ็กเกจ'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.12)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: '#4ade80',
                        }}
                      >
                        {p.sellingPrice.toLocaleString()} ฿
                      </span>

                      <button
                        onClick={() => handleDeletePack(p.priceId, p.name || 'แพ็กเกจ')}
                        disabled={deleteMutation.isPending}
                        title="ลบแพ็กเกจนี้"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.3rem 0.55rem',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button type="button" className="btn-secondary" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

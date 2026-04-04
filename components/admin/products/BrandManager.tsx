"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Save, Search } from "lucide-react";
import { getBrands, createBrand, updateBrand, deleteBrand } from "@/actions/brand.actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Brand {
  id: string;
  name: string;
}

interface Props {
  onClose: () => void;
  onRefresh: () => void;
}

export function BrandManager({ onClose, onRefresh }: Props) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredBrands = useMemo(() => {
    return brands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [brands, searchTerm]);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    setLoading(true);
    const data = await getBrands();
    setBrands(data);
    setLoading(false);
  }

  const handleOpenFormModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setName(brand.name);
    } else {
      setEditingBrand(null);
      setName("");
    }
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingBrand(null);
    setName("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, { name });
      } else {
        await createBrand({ name });
      }
      handleCloseFormModal();
      await fetchBrands();
      onRefresh();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al guardar la marca");
    } finally {
      setSubmitting(false);
    }
  }

  const handleOpenDeleteModal = (brand: Brand) => {
    setBrandToDelete(brand);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBrandToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!brandToDelete) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBrand(brandToDelete.id);
      await fetchBrands();
      onRefresh();
      router.refresh();
      handleCloseDeleteModal();
    } catch (error) {
      console.error(error);
      setDeleteError(error instanceof Error ? error.message : "Error al eliminar la marca");
    } finally {
      setDeleting(false);
    }
  };

  async function handleDelete(id: string) {
    // Handled by handleOpenDeleteModal
  }

  function handleEdit(brand: Brand) {
    handleOpenFormModal(brand);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="font-heading font-bold text-gray-800">Gestionar Marcas</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en la lista..."
                className="input pl-9 h-10 text-xs"
                autoFocus
              />
            </div>
            <button
              onClick={() => handleOpenFormModal()}
              className="btn-primary px-4 h-10 text-sm flex items-center gap-1.5"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[#11ABC4]" />
            </div>
          ) : filteredBrands.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">
              {searchTerm ? "No se encontraron coincidencias" : "No hay marcas registradas"}
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Lista de marcas</span>
                <span>Acciones</span>
              </div>
              {filteredBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">{brand.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(brand)}
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors font-semibold"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(brand)}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors font-semibold"
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Add/Edit Brand */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-heading font-bold text-gray-800">
                {editingBrand ? "Editar Marca" : "Nueva Marca"}
              </h3>
              <button onClick={handleCloseFormModal} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Nombre de la Marca</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: WINNER, NIKE..."
                  className="input w-full h-11 text-sm"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="btn-secondary flex-1 h-11 text-sm font-semibold"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="btn-primary flex-1 h-11 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Delete Confirmation */}
      {isDeleteModalOpen && brandToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">¿Eliminar Marca?</h3>
              <p className="text-gray-500 text-xs">
                ¿Estás seguro de eliminar la marca <span className="font-bold text-gray-900">"{brandToDelete.name}"</span>?
              </p>

              {deleteError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-left">
                  <X size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-red-600 font-medium leading-tight">
                    {deleteError}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-4 py-3 flex gap-2">
              <button
                onClick={handleCloseDeleteModal}
                className="btn-secondary flex-1 h-9 text-xs font-semibold"
                disabled={deleting}
              >
                cancelar
              </button>
              <button
                onClick={(e) => confirmDelete(e)}
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 flex-1 h-9 text-xs font-semibold flex items-center justify-center gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

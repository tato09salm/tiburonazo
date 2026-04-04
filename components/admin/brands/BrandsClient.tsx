"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, Save, X } from "lucide-react";
import { createBrand, updateBrand, deleteBrand } from "@/actions/brand.actions";
import { useRouter } from "next/navigation";

interface Brand {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface Props {
  initialBrands: Brand[];
}

export function BrandsClient({ initialBrands }: Props) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [brands, searchTerm]);

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setName(brand.name);
    } else {
      setEditingBrand(null);
      setName("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setName("");
  };

  const handleOpenDeleteModal = (brand: Brand) => {
    setBrandToDelete(brand);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBrandToDelete(null);
    setDeleteError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingBrand) {
        const updated = await updateBrand(editingBrand.id, { name });
        setBrands(brands.map((b) => (b.id === updated.id ? updated : b)));
      } else {
        const created = await createBrand({ name });
        setBrands([...brands, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      handleCloseModal();
      router.refresh();
      // Force sorting after update/create in case router.refresh takes time
      setBrands(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error(error);
      alert("Error al guardar la marca");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!brandToDelete) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBrand(brandToDelete.id);
      setBrands(brands.filter((b) => b.id !== brandToDelete.id));
      handleCloseDeleteModal();
      router.refresh();
    } catch (error) {
      console.error(error);
      setDeleteError(error instanceof Error ? error.message : "Error al eliminar la marca");
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // This is now handled by handleOpenDeleteModal and confirmDelete
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Gestionar Marcas</h1>
          <p className="text-gray-500 text-sm mt-1">{brands.length} marcas registradas</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Agregar
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar marcas..."
            className="input pl-9 text-sm h-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Lista de marcas</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron marcas
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{brand.name}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(brand)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#11ABC4] hover:bg-[#CCECFB] px-3 py-1.5 rounded-lg transition-colors font-semibold"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(brand)}
                          className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="font-heading font-bold text-gray-800">
                {editingBrand ? "Editar Marca" : "Agregar Marca"}
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre de la marca"
                  className="input w-full h-10 text-sm"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary flex-1 h-11 text-sm font-semibold"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Marca</h3>
              <p className="text-gray-500 text-sm">
                ¿Estás seguro de eliminar la marca <span className="font-bold text-gray-900">"{brandToDelete.name}"</span>?
              </p>
              
              {deleteError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-left">
                  <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-medium leading-tight">
                    {deleteError}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="btn-secondary flex-1 h-11 text-sm font-semibold"
                disabled={deleting}
              >
                cancelar
              </button>
              <button
                onClick={(e) => confirmDelete(e)}
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 flex-1 h-11 text-sm font-semibold flex items-center justify-center gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 size={18} className="animate-spin" />
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

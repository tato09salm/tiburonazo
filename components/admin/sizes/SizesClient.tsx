"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, Save, X } from "lucide-react";
import { createSize, updateSize, deleteSize } from "@/actions/size.actions";
import { useRouter } from "next/navigation";

interface Size {
  id: string;
  label: string;
  category: string | null;
  sortOrder: number;
}

interface Props {
  initialSizes: Size[];
  productCategories: string[];
}

export function SizesClient({ initialSizes, productCategories }: Props) {
  const router = useRouter();
  const [sizes, setSizes] = useState<Size[]>(initialSizes);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [sizeToDelete, setSizeToDelete] = useState<Size | null>(null);
  const [label, setLabel] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const existingCategories = useMemo(() => {
    const sizeCats = sizes.flatMap(s => (s.category || "").split(",").map(c => c.trim())).filter(Boolean);
    const allUniqueCats = Array.from(new Set([...sizeCats, ...productCategories])).filter(c => c.toLowerCase() !== "default");
    return ["Default", ...allUniqueCats.sort()];
  }, [sizes, productCategories]);

  const filteredSizes = useMemo(() => {
    return sizes.filter((s) =>
      s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sizes, searchTerm]);

  const handleOpenModal = (size?: Size) => {
    if (size) {
      setEditingSize(size);
      setLabel(size.label);
      const cats = (size.category || "").split(",").map(c => c.trim()).filter(Boolean);
      setSelectedCategories(cats);
      setSortOrder(size.sortOrder);
    } else {
      setEditingSize(null);
      setLabel("");
      setSelectedCategories([]);
      setSortOrder(0);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSize(null);
    setLabel("");
    setSelectedCategories([]);
    setSortOrder(0);
  };

  const addCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (trimmed && !selectedCategories.includes(trimmed)) {
      setSelectedCategories([...selectedCategories, trimmed]);
    }
  };

  const removeCategory = (cat: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== cat));
  };

  const handleOpenDeleteModal = (size: Size) => {
    setSizeToDelete(size);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSizeToDelete(null);
    setDeleteError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!label.trim()) return;

    const categoryString = selectedCategories.join(", ");

    setSubmitting(true);
    try {
      if (editingSize) {
        const updated = await updateSize(editingSize.id, { 
          label, 
          category: categoryString || undefined, 
          sortOrder: Number(sortOrder) 
        });
        setSizes(sizes.map((s) => (s.id === updated.id ? (updated as Size) : s)).sort((a, b) => {
          if (a.category !== b.category) return (a.category || "").localeCompare(b.category || "");
          return a.sortOrder - b.sortOrder;
        }));
      } else {
        const created = await createSize({ 
          label, 
          category: categoryString || undefined, 
          sortOrder: Number(sortOrder) 
        });
        const newSizes = [...sizes, created as Size].sort((a, b) => {
          if (a.category !== b.category) return (a.category || "").localeCompare(b.category || "");
          return a.sortOrder - b.sortOrder;
        });
        setSizes(newSizes);
      }
      handleCloseModal();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al guardar la talla");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sizeToDelete) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSize(sizeToDelete.id);
      setSizes(sizes.filter((s) => s.id !== sizeToDelete.id));
      handleCloseDeleteModal();
      router.refresh();
    } catch (error) {
      console.error(error);
      setDeleteError(error instanceof Error ? error.message : "Error al eliminar la talla");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Gestionar Tallas</h1>
          <p className="text-gray-500 text-sm mt-1">{sizes.length} tallas registradas</p>
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
            placeholder="Buscar tallas o categorías..."
            className="input pl-9 text-sm h-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Etiqueta (Label)</th>
                <th className="px-6 py-3 text-left">Categoría</th>
                <th className="px-6 py-3 text-left">Orden</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSizes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron tallas
                  </td>
                </tr>
              ) : (
                filteredSizes.map((size) => (
                  <tr key={size.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{size.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {size.category ? (
                          size.category.split(",").map((cat, idx) => (
                            <span key={idx} className="text-[10px] text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full border border-gray-200">
                              {cat.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-[10px] italic">General</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 font-mono text-xs">{size.sortOrder}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(size)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#11ABC4] hover:bg-[#CCECFB] px-3 py-1.5 rounded-lg transition-colors font-semibold"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(size)}
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="font-heading font-bold text-gray-800">
                {editingSize ? "Editar Talla" : "Agregar Talla"}
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta (Label) *</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej: XS, M, L, 42, 38"
                  className="input w-full h-10 text-sm"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorías (Opcional)</label>
                
                {/* Selected Categories Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedCategories.map((cat) => (
                    <span 
                      key={cat} 
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#CCECFB] text-[#11ABC4] text-xs font-bold rounded-lg border border-[#11ABC4]/20"
                    >
                      {cat}
                      <button 
                        type="button" 
                        onClick={() => removeCategory(cat)}
                        className="hover:bg-[#11ABC4] hover:text-white rounded-full p-0.5 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  {selectedCategories.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Ninguna seleccionada</span>
                  )}
                </div>

                <div className="relative group">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value=""
                        onChange={(e) => addCategory(e.target.value)}
                        className="input w-full h-10 text-sm appearance-none pr-8"
                      >
                        <option value="">Seleccionar categoría...</option>
                        {existingCategories
                          .filter(cat => !selectedCategories.includes(cat))
                          .map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))
                        }
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Search size={14} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic">Selecciona las categorías para agrupar esta talla.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden de clasificación</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="input w-full h-10 text-sm"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">Define el orden en el que aparecerá en la tienda (menor a mayor).</p>
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
                  disabled={submitting || !label.trim()}
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
      {isDeleteModalOpen && sizeToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Talla</h3>
              <p className="text-gray-500 text-sm">
                ¿Estás seguro de eliminar la talla <span className="font-bold text-gray-900">"{sizeToDelete.label}"</span>?
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

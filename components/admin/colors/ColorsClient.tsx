"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, Save, X } from "lucide-react";
import { createColor, updateColor, deleteColor } from "@/actions/color.actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Color {
  id: string;
  name: string;
  hex?: string | null;
}

interface Props {
  initialColors: Color[];
}

export function ColorsClient({ initialColors }: Props) {
  const router = useRouter();
  const [colors, setColors] = useState<Color[]>(initialColors);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [colorToDelete, setColorToDelete] = useState<Color | null>(null);
  const [name, setName] = useState("");
  const [hex, setHex] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredColors = useMemo(() => {
    return colors.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [colors, searchTerm]);

  const handleOpenModal = (color?: Color) => {
    if (color) {
      setEditingColor(color);
      setName(color.name);
      setHex(color.hex || "");
    } else {
      setEditingColor(null);
      setName("");
      setHex("#000000");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingColor(null);
    setName("");
    setHex("");
  };

  const handleOpenDeleteModal = (color: Color) => {
    setColorToDelete(color);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setColorToDelete(null);
    setDeleteError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingColor) {
        const updated = await updateColor(editingColor.id, { name, hex });
        setColors(colors.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createColor({ name, hex });
        setColors([...colors, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      handleCloseModal();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el color");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!colorToDelete) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteColor(colorToDelete.id);
      setColors(colors.filter((c) => c.id !== colorToDelete.id));
      handleCloseDeleteModal();
      router.refresh();
    } catch (error) {
      console.error(error);
      setDeleteError(error instanceof Error ? error.message : "Error al eliminar el color");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Gestionar Colores</h1>
          <p className="text-gray-500 text-sm mt-1">{colors.length} colores registrados</p>
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
            placeholder="Buscar colores..."
            className="input pl-9 text-sm h-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Lista de colores</th>
                <th className="px-6 py-3 text-left">Muestra</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredColors.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron colores
                  </td>
                </tr>
              ) : (
                filteredColors.map((color) => (
                  <tr key={color.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{color.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className={cn(
                            "w-6 h-6 rounded-full border border-gray-200",
                            color.name.toLowerCase() === "transparente" && "bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-gray-100"
                          )}
                          style={{ backgroundColor: color.name.toLowerCase() === "transparente" ? undefined : (color.hex || "#fff") }}
                        />
                        <span className="font-mono text-xs text-gray-400 uppercase">{color.hex || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(color)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#11ABC4] hover:bg-[#CCECFB] px-3 py-1.5 rounded-lg transition-colors font-semibold"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(color)}
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
                {editingColor ? "Editar Color" : "Agregar Color"}
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
                  placeholder="Nombre del color (Ej: Rojo, Azul Marino)"
                  className="input w-full h-10 text-sm"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color (Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    className="w-10 h-10 p-0 border-none rounded-lg cursor-pointer bg-transparent"
                  />
                  <input
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    placeholder="#000000"
                    className="input flex-1 h-10 text-sm font-mono uppercase"
                    maxLength={7}
                  />
                </div>
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
      {isDeleteModalOpen && colorToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Color</h3>
              <p className="text-gray-500 text-sm">
                ¿Estás seguro de eliminar el color <span className="font-bold text-gray-900">"{colorToDelete.name}"</span>?
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

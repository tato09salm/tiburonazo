"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, Save, X, Eye, EyeOff } from "lucide-react";
import { createSection, updateSection, deleteSection, toggleSectionStatus } from "@/actions/section.actions";
import { useRouter } from "next/navigation";
import { cn, slugify } from "@/lib/utils";

interface Section {
  id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
}

interface Props {
  initialSections: Section[];
}

export function SectionsClient({ initialSections }: Props) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredSections = useMemo(() => {
    return sections.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.order - b.order);
  }, [sections, searchTerm]);

  const handleOpenModal = (section?: Section) => {
    if (section) {
      setEditingSection(section);
      setName(section.name);
      setSlug(section.slug);
      setOrder(section.order);
      setIsActive(section.isActive);
      setIsManualSlug(true);
    } else {
      setEditingSection(null);
      setName("");
      setSlug("");
      setOrder(sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 1);
      setIsActive(true);
      setIsManualSlug(false);
    }
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSection(null);
    setName("");
    setSlug("");
    setOrder(0);
    setIsActive(true);
    setIsManualSlug(false);
    setFormError(null);
  };

  const handleOpenDeleteModal = (section: Section) => {
    setSectionToDelete(section);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSectionToDelete(null);
    setDeleteError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingSection) {
        const updated = await updateSection(editingSection.id, { 
          name, 
          slug, 
          order: Number(order),
          isActive
        });
        setSections(sections.map((s) => (s.id === updated.id ? (updated as Section) : s)));
      } else {
        const created = await createSection({ 
          name, 
          slug, 
          order: Number(order),
          isActive
        });
        setSections([...sections, created as Section]);
      }
      handleCloseModal();
      router.refresh();
    } catch (error: any) {
      console.error(error);
      setFormError(error.message || "Error al guardar la sección");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (section: Section) => {
    try {
      const updated = await toggleSectionStatus(section.id, section.isActive);
      setSections(sections.map((s) => (s.id === updated.id ? (updated as Section) : s)));
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al cambiar el estado");
    }
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sectionToDelete) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSection(sectionToDelete.id);
      setSections(sections.filter((s) => s.id !== sectionToDelete.id));
      handleCloseDeleteModal();
      router.refresh();
    } catch (error: any) {
      console.error(error);
      const message = error.message || "Error al eliminar la sección";
      setDeleteError(message.includes("uso") ? "Esta sección está en uso" : message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Secciones del Menú</h1>
          <p className="text-gray-500 text-sm">Gestiona las opciones de navegación del frontend.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
        >
          <Plus size={20} />
          Nueva Sección
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar secciones..."
              className="input pl-10 h-11 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/30">
                <th className="px-6 py-4 w-16">Orden</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Link / Slug</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSections.map((section) => (
                <tr key={section.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-[#11ABC4] bg-[#CCECFB] px-2 py-1 rounded-md">
                      {section.order}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-700">{section.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                      {section.slug}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(section)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                        section.isActive 
                          ? "bg-green-100 text-green-600 hover:bg-green-200" 
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      )}
                    >
                      {section.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                      {section.isActive ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(section)}
                        className="p-2 text-gray-400 hover:text-[#11ABC4] hover:bg-[#CCECFB] rounded-lg transition-all"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(section)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSections.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No se encontraron secciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                {editingSection ? "Editar Sección" : "Nueva Sección"}
              </h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Sección</label>
                <input
                  value={name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setName(newName);
                    if (!isManualSlug) {
                      setSlug(slugify(newName));
                    }
                  }}
                  className="input"
                  placeholder="Ej: Hombre, Mujer, Niño..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Link / Slug</label>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsManualSlug(true);
                  }}
                  className="input font-mono text-xs"
                  placeholder="Ej: hombre, mujer, nino..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Orden</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                  <div className="flex items-center h-11">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11ABC4]"></div>
                      <span className="ml-3 text-sm font-medium text-gray-600">{isActive ? "Activo" : "Inactivo"}</span>
                    </label>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                  <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{formError}</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary py-3 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {editingSection ? "Guardar Cambios" : "Crear Sección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {isDeleteModalOpen && sectionToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminar Sección</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                ¿Estás seguro de eliminar la sección <span className="font-bold text-gray-900">"{sectionToDelete.name}"</span>? Esta acción no se puede deshacer.
              </p>
              
              {deleteError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-left">
                  <X size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 font-medium leading-tight">
                    {deleteError}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-8 py-6 flex gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="btn-secondary flex-1 h-12 rounded-xl text-sm font-bold"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={(e) => confirmDelete(e)}
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 flex-1 h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

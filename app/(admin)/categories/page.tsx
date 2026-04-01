import { getCategories } from "@/actions/category.actions";
import { CategoryForm } from "@/components/admin/categories/CategoryForm";
import { DeleteCategoryButton } from "@/components/admin/categories/DeleteCategoryButton";
import { Tag, FolderOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categorías - Admin" };

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-gray-900">Categorías</h1>
        <p className="text-gray-500 text-sm mt-1">{categories.length} categorías principales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
            <Tag size={18} className="text-[#11ABC4]" /> Nueva categoría
          </h2>
          <CategoryForm parentCategories={categories} />
        </div>

        {/* List */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-heading text-lg font-bold">Categorías existentes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <div key={cat.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#CCECFB] flex items-center justify-center text-[#11ABC4]">
                      <FolderOpen size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{cat.name}</p>
                      <p className="text-xs text-gray-400">{cat.slug} · {(cat as { _count?: { products: number } })._count?.products ?? 0} productos</p>
                    </div>
                  </div>
                  <DeleteCategoryButton id={cat.id} name={cat.name} />
                </div>
                {cat.children?.length > 0 && (
                  <div className="ml-12 mt-2 space-y-1">
                    {cat.children.map((child) => (
                      <div key={child.id} className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="w-4 h-px bg-gray-200" />
                        {child.name}
                        <span className="text-xs text-gray-300">({child.slug})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

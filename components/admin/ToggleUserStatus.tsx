"use client";

import { useState } from "react";
import { toggleUserStatus } from "@/actions/admin.actions";
import { Power, PowerOff, Loader2 } from "lucide-react";

interface Props {
  id: string;
  isActive: boolean;
}

export function ToggleUserStatus({ id, isActive }: Props) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleUserStatus(id, isActive);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors ${
        isActive 
          ? "text-green-600 hover:bg-green-50" 
          : "text-red-400 hover:bg-red-50"
      }`}
      title={isActive ? "Desactivar usuario" : "Activar usuario"}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin text-gray-400" />
      ) : isActive ? (
        <Power size={18} />
      ) : (
        <PowerOff size={18} />
      )}
    </button>
  );
}
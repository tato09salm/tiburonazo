import { useMemo } from "react";
import { getDepartments, getProvinces, getDistricts } from "ubigeo-fns";
import { cn } from "@/lib/utils";

interface UbigeoProps {
  dept: string;
  prov: string;
  dist: string;
  onChange: (type: "dept" | "prov" | "dist", value: string) => void;
}

export const UbigeoSelects = ({ dept, prov, dist, onChange }: UbigeoProps) => {
  const departments = useMemo(() => getDepartments(), []);
  const provinces = useMemo(() => dept ? getProvinces(dept) : [], [dept]);
  const districts = useMemo(() => prov ? getDistricts(prov) : [], [prov]);

  // Clase CSS para forzar scroll y dirección hacia abajo
  const selectClass = "input appearance-none bg-white cursor-pointer focus:ring-2 focus:ring-[#11ABC4]/20 outline-none overflow-y-auto";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Departamento</label>
        <select 
          size={1} 
          className={selectClass} 
          value={dept} 
          required 
          onChange={(e) => onChange("dept", e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {departments.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Provincia</label>
        <select 
          className={cn(selectClass, "disabled:opacity-50")} 
          value={prov} 
          required 
          disabled={!dept} 
          onChange={(e) => onChange("prov", e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Distrito</label>
        <select 
          className={cn(selectClass, "disabled:opacity-50")} 
          value={dist} 
          required 
          disabled={!prov} 
          onChange={(e) => onChange("dist", e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
        </select>
      </div>
      
      <style jsx>{`
        select {
          max-height: 160px; /* Aproximadamente 4 items de 40px */
        }
        /* Forzar apertura hacia abajo en navegadores que lo soportan */
        select:-moz-focusring { color: transparent; text-shadow: 0 0 0 #000; }
      `}</style>
    </div>
  );
};
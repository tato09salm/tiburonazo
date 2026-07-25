"use client";

import { useMemo } from "react";
import { getDepartments, getProvinces, getDistricts } from "ubigeo-fns";
import { cn } from "@/lib/utils";

interface UbigeoProps {
    dept: string;
    prov: string;
    dist: string;
    onChange: (type: "dept" | "prov" | "dist", value: string) => void;
}

export function UbigeoSelects({ dept, prov, dist, onChange }: UbigeoProps) {
    const departments = useMemo(() => getDepartments(), []);
    const provinces = useMemo(() => (dept ? getProvinces(dept) : []), [dept]);
    const districts = useMemo(() => (prov ? getDistricts(prov) : []), [prov]);

    const selectClass = "input appearance-none bg-white cursor-pointer focus:ring-2 focus:ring-[#11ABC4]/20 outline-none overflow-y-auto text-xs h-10";

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Departamento</label>
                <select
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
        </div>
    );
}
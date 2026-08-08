import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = ["Carrito", "Entrega", "Pago"];
  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
              idx <= currentStep ? "bg-[#11ABC4] text-white" : "bg-gray-100 text-gray-400"
            )}>
              {idx < currentStep ? <CheckCircle2 size={20} /> : idx + 1}
            </div>
            <span className={cn("text-[10px] font-black uppercase mt-2 tracking-widest", 
              idx <= currentStep ? "text-[#11ABC4]" : "text-gray-400")}>
              {step}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={cn("w-12 sm:w-20 h-[3px] mx-2 mb-5 rounded-full", 
              idx < currentStep ? "bg-[#11ABC4]" : "bg-gray-100")} />
          )}
        </div>
      ))}
    </div>
  );
};
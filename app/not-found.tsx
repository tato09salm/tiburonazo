import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fbff] to-[#CCECFB]">
      <div className="text-center px-4">
        <div className="text-9xl font-brand text-[#11ABC4] font-bold opacity-20 select-none">404</div>
        <div className="text-6xl mb-4 -mt-8">🦈</div>
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-2">Página no encontrada</h1>
        <p className="text-gray-500 mb-8">Parece que este tiburón nadó muy lejos...</p>
        <Link href="/" className="btn-primary inline-block">Volver al inicio</Link>
      </div>
    </div>
  );
}

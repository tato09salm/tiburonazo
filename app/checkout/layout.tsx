import Link from "next/link";
import Image from "next/image";

export const metadata = {
    title: "Checkout Seguro | Tiburonazo",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header Estático: Fluye de forma natural con el scroll de la página */}
            <header className="w-full">
                <div className="mx-auto flex h-12 max-w-6xl items-center px-4">

                    {/* Contenedor del Logo Simplificado */}
                    <Link href="/" className="flex items-center transition-opacity hover:opacity-90">
                        <Image
                            src="/logo.png"
                            alt="Tiburonazo Logo"
                            width={130}
                            height={38}
                            className="object-contain"
                            priority
                        />
                    </Link>

                </div>
            </header>

            {/* Contenido principal */}
            <main className="flex-1 w-full max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
}
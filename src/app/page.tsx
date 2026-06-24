import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-50 text-gray-900">
      <main className="flex flex-col gap-8 items-center max-w-2xl w-full text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          WIWOKDETOK
        </h1>
        <p className="text-lg text-gray-600">
          Workflow Internal Workspace Optimalisasi Kerja Dengan Efektif Tracking Organisasi Karyawan.
        </p>
        
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-6">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-gray-900 text-white gap-2 hover:bg-gray-800 text-sm sm:text-base h-12 px-8"
            href="/workspaces"
          >
            Mulai ke Workspace
          </Link>
          <Link
            className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center hover:bg-gray-100 text-sm sm:text-base h-12 px-8"
            href="/login"
          >
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}

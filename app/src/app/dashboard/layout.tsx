import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import LogoutButton from '@/components/LogoutButton'
import OrbitLogo from '@/components/OrbitLogo'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0c1c]/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <OrbitLogo />
            <span className="font-bold tracking-tight text-lg text-gradient">Orbitmap</span>
          </Link>
          <div className="flex items-center gap-5">
            <span className="text-sm text-slate-400 hidden sm:inline">{session.username}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}

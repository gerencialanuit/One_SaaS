import { Sidebar } from '@/shared/components/Sidebar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Sidebar />
      <main className="pl-16">{children}</main>
    </div>
  )
}

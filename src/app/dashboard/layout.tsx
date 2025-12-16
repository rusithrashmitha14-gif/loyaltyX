export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Removed conflicting server-side session check.
  // The application uses client-side JWT auth (localStorage) managed by auth-utils.ts
  // and enforced by useEffect in page components.

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                LoyaltyX Dashboard
              </h1>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

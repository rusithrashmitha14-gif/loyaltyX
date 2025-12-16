export default function CustomerPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Customer Portal
          </h1>
          <p className="text-lg text-gray-600">
            Check your loyalty points and redeem rewards
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-600">0</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Your Points</h2>
            <p className="text-gray-600">Start shopping to earn points!</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Rewards</h3>
              <p className="text-gray-500">No rewards available yet</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <p className="text-gray-500">No activity yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}








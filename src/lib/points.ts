// Points calculation logic
// Formula: 1 point per Rs. 100 spent (e.g., Rs. 5000 = 50 points)
export const POINTS_PER_100_RUPEES = 1

export function calculatePoints(amount: number): number {
  return Math.floor(amount / 100)
}

export function calculatePointsValue(points: number): number {
  return points * 100
}

export function canRedeemPoints(customerPoints: number, requiredPoints: number): boolean {
  return customerPoints >= requiredPoints
}









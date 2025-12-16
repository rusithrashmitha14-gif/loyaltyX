# 📊 LoyaltyX Analytics & Reporting Module

## ✅ Complete Implementation Summary

### 🗄️ Database Schema Updates

Updated models in `prisma/schema.prisma`:

**Customer Model:**
- Added `lastVisitAt` (DateTime?) - Tracks last transaction date
- Added `createdAt` (DateTime) - Customer registration date

**Transaction Model:**
- Added `createdAt` (DateTime) - Transaction timestamp
- Added index on `[businessId, createdAt]` for faster queries

**Redemption Model:**
- Added `createdAt` (DateTime) - Redemption timestamp
- Added index on `createdAt` for faster queries

**Status:** ✅ Schema updated and pushed to database

---

## 🌐 Analytics API Endpoints

All endpoints at: `/api/analytics`

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/summary` | GET | KPI summary | `range=30d` |
| `/top-customers` | GET | Top customers by spend | `range=30d&limit=10` |
| `/transactions-timeseries` | GET | Transactions over time | `range=30d&interval=day` |
| `/top-rewards` | GET | Most redeemed rewards | `range=90d&limit=10` |
| `/at-risk-customers` | GET | Inactive customers | `inactive_days=60&limit=50` |

### 1. GET /api/analytics/summary

**Returns:**
```json
{
  "success": true,
  "data": {
    "range": "30d",
    "totalPointsIssued": 5000,
    "totalPointsRedeemed": 1200,
    "netPoints": 3800,
    "activeCustomers": 45,
    "totalCustomers": 100,
    "totalTransactions": 230,
    "totalRevenue": 575000.00,
    "avgSpendPerVisit": 2500.00,
    "totalRedemptions": 35,
    "redemptionRate": 24.0
  }
}
```

### 2. GET /api/analytics/top-customers

**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "points": 350,
      "totalSpend": 45000.00,
      "transactionCount": 15,
      "avgSpend": 3000.00,
      "lastVisit": "2025-10-05T10:30:00Z"
    }
  ]
}
```

### 3. GET /api/analytics/transactions-timeseries

**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-09-10",
      "transactions": 12,
      "revenue": 35000.00,
      "pointsIssued": 350,
      "pointsRedeemed": 100,
      "redemptions": 3
    }
  ]
}
```

### 4. GET /api/analytics/top-rewards

**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Free Coffee",
      "redemptionCount": 45,
      "totalPointsUsed": 4500,
      "pointsRequired": 100
    }
  ]
}
```

### 5. GET /api/analytics/at-risk-customers

**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "points": 75,
      "lastVisitAt": "2025-07-15T14:20:00Z",
      "daysSinceLastVisit": 87,
      "lastTransactionAmount": 2500.00
    }
  ]
}
```

---

## 🎨 Frontend Components

### Components Created

| File | Purpose |
|------|---------|
| `components/analytics/AnalyticsCard.tsx` | KPI cards with icons and trends |
| `components/analytics/DateRangePicker.tsx` | Date range selector (7d/30d/90d/365d) |
| `components/analytics/AnalyticsTable.tsx` | Reusable data tables with loading states |

### Analytics Dashboard Page

**Location:** `/app/dashboard/analytics/page.tsx`

**Features:**
- 📊 4 KPI Cards (Points Issued, Redeemed, Active Customers, Avg Spend)
- 📈 Transactions Over Time (Line Chart)
- 📉 Points Issued vs Redeemed (Area Chart)
- 📊 Most Popular Rewards (Bar Chart)
- 📋 Top Customers Table
- ⚠️ At-Risk Customers Table
- 🎯 Top Rewards Table
- 📅 Date Range Selector
- 🔄 Auto-refresh on date change
- ✨ Loading states and empty states

---

## 📊 Key Metrics (KPIs)

### 1. Total Points Issued
- Sum of all points awarded from transactions
- Calculation: `Σ floor(transaction.amount / 100)`

### 2. Total Points Redeemed
- Sum of all points used for rewards
- Calculation: `Σ reward.pointsRequired`

### 3. Active Customers
- Unique customers with ≥1 transaction in period
- Shows engagement level

### 4. Average Spend per Visit
- Total revenue / total transactions
- Measures transaction value

### 5. Redemption Rate
- (Points Redeemed / Points Issued) × 100
- Shows how actively customers use rewards

### 6. Net Points
- Points Issued - Points Redeemed
- Shows unredeemed liability

---

## 📈 Charts Implemented

### 1. Transactions Over Time (Line Chart)
- X-axis: Date
- Y-axis: Number of transactions & Revenue
- Shows daily trend

### 2. Points Issued vs Redeemed (Area Chart)
- Visualizes points flow
- Green area: Points issued
- Purple area: Points redeemed
- Shows engagement trends

### 3. Most Popular Rewards (Horizontal Bar Chart)
- Ranks rewards by redemption count
- Helps identify popular rewards

---

## 📋 Tables

### 1. Top Customers by Spend
**Columns:**
- Customer (name, email)
- Total Spend (LKR)
- Current Points
- Number of Visits

**Sorted by:** Total spend (descending)

### 2. At-Risk Customers
**Columns:**
- Customer (name, email)
- Current Points
- Days Since Last Visit

**Criteria:** No visit in 60+ days  
**Use case:** Re-engagement campaigns

### 3. Top Redeemed Rewards
**Columns:**
- Reward (title, description)
- Points Required
- Redemption Count
- Total Points Used

**Sorted by:** Redemption count (descending)

---

## 🎯 How to Access

### Option 1: Dashboard Tab
1. Go to http://localhost:3000/dashboard
2. Click "Analytics" tab
3. View complete analytics

### Option 2: Direct URL
- http://localhost:3000/dashboard/analytics

---

## 🔧 Date Range Filters

Available ranges:
- **7 days** - Weekly performance
- **30 days** - Monthly trends (default)
- **90 days** - Quarterly insights
- **365 days** - Yearly overview

All charts and metrics automatically update when range changes.

---

## 🎨 UI/UX Features

✅ **Modern SaaS Design**
- Clean white cards with shadows
- Color-coded metrics (green, blue, purple, yellow)
- Responsive layout (mobile/tablet/desktop)
- Smooth transitions and hover effects

✅ **Loading States**
- Skeleton loaders for cards
- Spinner for charts
- Smooth data transitions

✅ **Empty States**
- Helpful messages when no data
- Suggestions for actions

✅ **Interactive Charts**
- Tooltips on hover
- Legend toggles
- Responsive sizing

✅ **Professional Typography**
- Clear hierarchy
- Readable fonts
- Proper spacing

---

## 🧮 Calculations & Logic

### Points Issued Calculation
```typescript
const pointsIssued = transactions.reduce((sum, t) => 
  sum + Math.floor(t.amount / 100), 0
);
```

### Points Redeemed Calculation
```typescript
const pointsRedeemed = redemptions.reduce((sum, r) => 
  sum + r.reward.pointsRequired, 0
);
```

### Active Customers
```typescript
const activeCustomers = new Set(
  transactions.map(t => t.customerId)
).size;
```

### At-Risk Detection
```typescript
// Customers with lastVisitAt > 60 days ago OR null
where: {
  OR: [
    { lastVisitAt: { lt: inactiveDate } },
    { lastVisitAt: null }
  ]
}
```

---

## 🚀 Testing

### View Analytics Dashboard

1. **Start dev server:** `npm run dev`
2. **Login:** http://localhost:3000/login
   - Email: `demo@loyaltyx.com`
   - Password: `password123`
3. **Access Analytics:** http://localhost:3000/dashboard/analytics

### Generate Sample Data

To see meaningful charts, add some test data:

```bash
# Using the dashboard UI:
1. Create customers (Customers tab)
2. Add transactions (Transactions tab)
3. Create rewards (Rewards tab)
4. Redeem rewards (Redemptions tab)
5. View Analytics (Analytics tab)
```

Or use the POS Integration API to bulk-create data.

---

## 📱 Responsive Design

### Desktop (1280px+)
- 4-column KPI cards
- 2-column charts
- Full-width tables

### Tablet (768px - 1279px)
- 2-column KPI cards
- Stacked charts
- Scrollable tables

### Mobile (< 768px)
- Stacked KPI cards
- Vertical charts
- Horizontal scroll tables

---

## 🔒 Security

All analytics endpoints are protected:
- ✅ JWT authentication required
- ✅ Business-scoped data (only see your own)
- ✅ No cross-business data leakage
- ✅ Proper error handling

---

## 🎯 Business Insights

### What You Can Learn

**Customer Behavior:**
- Who are my best customers?
- Who is at risk of churning?
- Average transaction value
- Visit frequency

**Program Performance:**
- Are customers earning points?
- Are they redeeming rewards?
- Which rewards are most popular?
- Is the program growing?

**Financial Metrics:**
- Total revenue trends
- Transaction volume
- Average basket size
- Points liability

---

## 📊 Charts Library

**Using Recharts:**
- Lightweight and performant
- TypeScript support
- Responsive by default
- Customizable themes
- Smooth animations

**Chart Types Used:**
- `LineChart` - Transactions & revenue trends
- `AreaChart` - Points flow visualization
- `BarChart` - Reward popularity

---

## 🎨 Color Scheme

| Metric | Color | Hex |
|--------|-------|-----|
| Points Issued | Green | #10B981 |
| Points Redeemed | Purple | #8B5CF6 |
| Active Customers | Blue | #3B82F6 |
| Revenue | Yellow | #F59E0B |
| At-Risk | Red | #EF4444 |

---

## 🔄 Auto-Refresh

Analytics data refreshes when:
- Date range changes
- Page is reloaded
- User navigates back to analytics

For real-time updates, consider implementing:
- WebSocket connections
- Polling every 30 seconds
- Server-Sent Events (SSE)

---

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   └── analytics/
│   │       ├── summary/route.ts
│   │       ├── top-customers/route.ts
│   │       ├── transactions-timeseries/route.ts
│   │       ├── top-rewards/route.ts
│   │       └── at-risk-customers/route.ts
│   └── dashboard/
│       └── analytics/
│           └── page.tsx
├── components/
│   └── analytics/
│       ├── AnalyticsCard.tsx
│       ├── AnalyticsTable.tsx
│       └── DateRangePicker.tsx
└── lib/
    └── points.ts (updated)
```

---

## 🎁 Additional Features to Consider

### Future Enhancements:
- 📧 Email reports (weekly/monthly)
- 📥 CSV/PDF export
- 🔔 Alert notifications (low redemption rate, etc.)
- 📊 Cohort analysis
- 💰 Customer Lifetime Value (CLV)
- 🎯 Predictive churn modeling
- 📈 Year-over-year comparisons
- 🏆 Customer segments (VIP, Regular, New)

### Performance Optimizations:
- Add `analytics_aggregates` table for pre-computed metrics
- Implement cron job for daily aggregation
- Cache frequently accessed data
- Implement incremental loading

---

## ✨ What's Working Now

✅ **Real-time KPIs** - Points, customers, revenue  
✅ **Interactive Charts** - Line, area, and bar charts  
✅ **Top Customers** - By spend and points  
✅ **Top Rewards** - By redemption count  
✅ **At-Risk Detection** - Inactive customers (60+ days)  
✅ **Date Filtering** - 7d, 30d, 90d, 365d  
✅ **Responsive Design** - Mobile/tablet/desktop  
✅ **Loading States** - Skeleton loaders  
✅ **Empty States** - Helpful messages  
✅ **Professional UI** - Tailwind + Recharts  

---

## 🚀 Access the Analytics Dashboard

**URL:** http://localhost:3000/dashboard/analytics

**Quick Access:**
1. Login at http://localhost:3000/login
2. Click "Analytics" button in main dashboard
3. Or go directly to `/dashboard/analytics`

---

## 📸 Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│  Analytics Dashboard         [Date Range Picker]│
├─────────────────────────────────────────────────┤
│  [Points]  [Points]  [Active]  [Avg Spend]     │
│  [Issued]  [Redeemed][Customers][Per Visit]     │
├─────────────────────────────────────────────────┤
│ [Transactions Chart] │ [Points Flow Chart]      │
├─────────────────────────────────────────────────┤
│         [Top Rewards Bar Chart]                 │
├─────────────────────────────────────────────────┤
│ [Top Customers]      │ [At-Risk Customers]      │
├─────────────────────────────────────────────────┤
│         [Top Rewards Detail Table]              │
├─────────────────────────────────────────────────┤
│ [Revenue] [Net Points] [Redemption Rate]        │
└─────────────────────────────────────────────────┘
```

---

## 🎊 All Set!

Your Analytics & Reporting module is fully functional and ready to use!

**Next Steps:**
1. Add sample data to see meaningful charts
2. Customize date ranges as needed
3. Export data if needed
4. Share insights with your team

Everything is working and integrated with your existing LoyaltyX dashboard! 🚀


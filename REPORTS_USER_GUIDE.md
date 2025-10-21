# 🎯 Reports Page - Quick User Guide

## How to View Different Reports

### Current Issue:
You're only seeing one report at a time because you need to **click on the report cards** to switch between different reports.

---

## 📊 How to Navigate Reports

### Step 1: Look at the Report Cards Section
After the "Today's Operations" section, you'll see **"Available Reports"** heading with report cards below:

```
┌────────────────────────────────────┐
│  📊 Available Reports              │
├────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐       │
│  │Occupancy │  │Billing   │       │
│  │Analysis  │  │Dashboard │       │
│  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐       │
│  │Branch    │  │Service   │       │
│  │Revenue   │  │Trends    │       │
│  └──────────┘  └──────────┘       │
└────────────────────────────────────┘
```

### Step 2: Click on Any Report Card
When you click on a report card, it will:
1. Load that report's data
2. Display the corresponding chart/table below
3. Highlight the active report card

### Available Reports:

#### 1. **Occupancy Analysis** (Default on page load)
- **What it shows**: Daily booking trends over time
- **Chart type**: Area chart with gradient fill
- **Data**: Number of bookings per day
- **Click to view**: Occupancy card (first card, top-left)

#### 2. **Billing Dashboard**
- **What it shows**: 
  - Summary cards (Total Billed, Total Paid, Outstanding)
  - Payment status pie chart
  - Top revenue guests list
  - Outstanding payments alert
- **Click to view**: Billing Dashboard card (second card, top-right)

#### 3. **Branch Revenue Monthly**
- **What it shows**: Monthly revenue breakdown by branch
- **Chart type**: Combined bar chart + line chart
- **Data**: Room revenue, service revenue, total revenue
- **Click to view**: Branch Revenue card (third card, bottom-left)

#### 4. **Service Usage Trend** (Now Fixed! ✅)
- **What it shows**: Top 5 services by revenue over time
- **Chart type**: Stacked area chart
- **Data**: Revenue trends for each service
- **Click to view**: Service Trends card (fourth card, bottom-right)

---

## 🎨 What Was Fixed

### 1. **Service Trend Chart** ✅
**Before:**
- All data points were overlapping at the same date
- Chart showed only 2 services on one date
- Looked broken and confusing

**After:**
- Data is properly grouped by date
- Each service has its own area
- Stacked visualization shows trends over time
- Proper date range on X-axis

### 2. **Advanced Filters Panel** ✅
**Before:**
- Plain white panel
- Basic gray borders
- Small text and inputs
- Boring appearance

**After:**
- **Gradient navy header** with glass-effect close button
- **Color-coded filter sections**:
  - Branch = Navy icon
  - Room Type = Blue icon
  - Status = Green icon
  - Date Range = Purple icon
  - Guest Type = Orange icon
- **Beautiful input fields** with focus states
- **Gradient gold "Apply" button**
- **Active filter count badge** with pulse animation
- **Better spacing and rounded corners**

---

## 🎯 How to Use the Reports Page

### Workflow:

1. **View Today's Operations**
   - See Arrivals, Departures, In-House count
   - Click "Export" on any card to download data

2. **Apply Filters (Optional)**
   - Click "Advanced Filters" button (navy gradient)
   - Select branch, room type, status, date range, etc.
   - Click "Apply Filters" (gold button)
   - Active filter count shows in badge

3. **Select a Report**
   - Click on any report card (Occupancy, Billing, Branch, Services)
   - Wait for data to load (spinner shows)
   - Report displays below

4. **Export Data**
   - Each chart has an "Export" button in the header
   - Click to download as CSV or Excel
   - Operations cards also have individual export buttons

5. **Refresh Data**
   - Click the refresh icon (top-right of hero header)
   - Reloads current active report with latest data

---

## 🔄 Report Switching Example

```
User Action                  →  What Happens
─────────────────────────────────────────────────
Page loads                   →  Occupancy chart shows (default)
Click "Billing Dashboard"    →  Shows billing metrics + pie chart
Click "Branch Revenue"       →  Shows monthly revenue bars + line
Click "Service Trends"       →  Shows service usage areas (now fixed!)
Click "Occupancy Analysis"   →  Back to occupancy chart
```

---

## 🎨 Visual Indicators

### Active Report Card:
- Currently selected report card is **highlighted**
- Check the `active` state on cards

### Loading State:
- Spinner appears with "Loading Report..." message
- Shows while fetching data from API

### Filter Badge:
- Navy button shows number of active filters
- Pulses with gold badge when filters are applied

---

## 💡 Tips

1. **Default View**: Page loads with Occupancy report by default
2. **One Report at a Time**: Only one main report displays at a time
3. **Operations Always Visible**: Today's operations cards stay visible above all reports
4. **Filters Apply to All**: Filters affect whichever report is currently active
5. **Export Anytime**: Can export data from any visible chart/table

---

## 🐛 Troubleshooting

### "I don't see any charts"
- Make sure you've clicked on a report card
- Check browser console for API errors
- Verify backend is running on port 4000

### "Charts look empty"
- Check if database has data for the selected date range
- Try clearing filters (Advanced Filters → Clear All)
- Refresh the page

### "Service chart still looks wrong"
- Clear browser cache (Ctrl + Shift + Delete)
- Hard refresh (Ctrl + F5)
- Chart now properly groups data by date

---

## 📊 Data Structure Now

### Service Trend Chart (Fixed):
```javascript
// OLD (Broken):
[
  { month: '2025-10-01', service_name: 'Airport Transfer', total_revenue: 5000 },
  { month: '2025-10-01', service_name: 'Laundry Service', total_revenue: 3000 }
]
// All on same date, overlapping!

// NEW (Fixed):
[
  { 
    date: '2025-10-01', 
    'Airport Transfer': 5000, 
    'Laundry Service': 3000,
    'Spa Service': 2500,
    ...
  },
  { 
    date: '2025-10-02', 
    'Airport Transfer': 4800, 
    'Laundry Service': 3200,
    ...
  }
]
// Properly grouped by date, each service is a column!
```

---

## ✅ Summary

**What You See Now:**
1. Beautiful hero header with refresh button
2. Today's operations cards (always visible)
3. Stylish Advanced Filters button
4. Report selection cards (4 options)
5. One active report chart/dashboard at a time

**To See Different Reports:**
- Just **click on the report cards**!
- Each card loads its corresponding report
- Only one report displays at a time (below the cards)

**Everything Is Working!** 🎉
- Service chart is fixed ✅
- Filters are beautiful ✅
- Reports switch on card click ✅
- All data is from real API ✅

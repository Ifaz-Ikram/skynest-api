# 🎨 SkyNest Reports - Design System Reference

## Color Palette & Usage Guide

### 🎯 Chart Header Gradients

```css
/* Occupancy & Payment Status Charts */
.bg-gradient-to-r.from-luxury-navy.to-indigo-900
/* Use for: Primary data visualization, most important metrics */
/* Colors: Navy (#1E3A8A) → Indigo-900 (#312E81) */

/* Branch Revenue Chart */
.bg-gradient-to-r.from-purple-500.to-purple-700
/* Use for: Location/branch-based metrics */
/* Colors: Purple-500 (#A855F7) → Purple-700 (#7E22CE) */

/* Service Trends Chart */
.bg-gradient-to-r.from-green-500.to-emerald-600
/* Use for: Revenue-generating services, growth metrics */
/* Colors: Green-500 (#22C55E) → Emerald-600 (#059669) */

/* Top Revenue Guests */
.bg-gradient-to-r.from-luxury-gold.to-yellow-600
/* Use for: VIP customers, premium features */
/* Colors: Gold (#D4AF37) → Yellow-600 (#CA8A04) */
```

### 💰 Metric Card Gradients

```css
/* Total Billed / Information */
.bg-gradient-to-r.from-blue-500.to-blue-600
/* Colors: Blue-500 (#3B82F6) → Blue-600 (#2563EB) */

/* Total Paid / Success */
.bg-gradient-to-r.from-green-500.to-emerald-600
/* Colors: Green-500 (#22C55E) → Emerald-600 (#059669) */

/* Outstanding / Alerts */
.bg-gradient-to-r.from-red-500.to-rose-600
/* Colors: Red-500 (#EF4444) → Rose-600 (#E11D48) */
```

### 🏨 Operations Card Gradients

```css
/* Arrivals Today */
.bg-gradient-to-r.from-green-500.to-emerald-600
/* Use for: Incoming guests, growth, positive actions */

/* Departures Today */
.bg-gradient-to-r.from-orange-500.to-amber-600
/* Use for: Outgoing guests, warnings, attention needed */

/* In-House Guests */
.bg-gradient-to-r.from-blue-500.to-indigo-600
/* Use for: Current state, status, information */
```

---

## 🎨 Glass Morphism Effects

### Icon Containers
```jsx
<div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
  <Icon className="w-6 h-6 text-white" />
</div>
```
**When to use:**
- Inside gradient headers
- For visual anchor points
- Around all header icons

### Buttons in Headers
```jsx
<button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 flex items-center gap-2">
  <Icon className="w-4 h-4" />
  Label
</button>
```
**When to use:**
- Export buttons in chart headers
- Action buttons on colored backgrounds
- Any button that needs to blend with gradient

---

## 📏 Typography Scale

### Headers
```jsx
<h3 className="text-2xl font-bold">Chart Title</h3>
```
**Use for:** Main chart/section titles

### Subtitles
```jsx
<p className="text-indigo-200 text-sm mt-1">30 records found</p>
<p className="text-green-100 text-sm mt-1">Highest spending customers</p>
<p className="text-purple-200 text-sm mt-1">12 months of data</p>
```
**Use for:** Context information, record counts, descriptions
**Note:** Color should be 100-200 shade of the gradient color

### Metric Numbers
```jsx
<p className="text-3xl font-bold">Rs 125,000</p>
```
**Use for:** Large numbers, key metrics in cards

### Labels
```jsx
<p className="text-sm text-blue-100 mb-1">Total Billed</p>
```
**Use for:** Metric labels above numbers

---

## 🎭 Animation Classes

### Card Hover Scale
```jsx
<div className="transform hover:scale-105 transition-all duration-300">
```
**Use for:** All metric cards, operation cards

### Button Hover
```jsx
<button className="hover:bg-white/30 transition-all duration-200">
```
**Use for:** Glass-effect buttons in headers

### Group Hover (Advanced)
```jsx
<div className="group">
  <div className="group-hover:shadow-2xl transition-all duration-300">
```
**Use for:** Report selection cards with multiple elements

---

## 📦 Card Structure Template

### Standard Chart Card
```jsx
<div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  {/* Header with gradient */}
  <div className="bg-gradient-to-r from-[color] to-[color] p-6">
    <div className="flex items-center justify-between text-white">
      {/* Left: Icon + Title */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">Chart Title</h3>
          <p className="text-[color]-200 text-sm mt-1">Subtitle/Context</p>
        </div>
      </div>
      
      {/* Right: Action Buttons */}
      <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 flex items-center gap-2">
        <Download className="w-4 h-4" />
        Export
      </button>
    </div>
  </div>
  
  {/* Content Area */}
  <div className="p-6">
    {/* Chart or table content */}
  </div>
</div>
```

### Metric Summary Card
```jsx
<div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-105 transition-all duration-300">
  <div className="bg-gradient-to-r from-[color] to-[color] p-6">
    <div className="flex items-center justify-between text-white">
      <div>
        <p className="text-sm text-[color]-100 mb-1">Metric Label</p>
        <p className="text-3xl font-bold">Value</p>
      </div>
      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
        <Icon className="w-8 h-8 text-white" />
      </div>
    </div>
  </div>
</div>
```

---

## 🎯 Quick Color Reference

| Purpose | Base Color | Gradient From → To | Text Color |
|---------|------------|-------------------|------------|
| Primary/Main | Navy | luxury-navy → indigo-900 | white |
| Success/Growth | Green | green-500 → emerald-600 | white |
| Information | Blue | blue-500 → blue-600/indigo-600 | white |
| Warning/Attention | Orange | orange-500 → amber-600 | white |
| Alert/Error | Red | red-500 → rose-600 | white |
| Premium/VIP | Gold | luxury-gold → yellow-600 | white |
| Special Feature | Purple | purple-500 → purple-700 | white |

---

## 📐 Spacing System

```css
/* Card Padding */
.p-6  /* Standard card content padding */

/* Icon Container */
.p-3  /* Icon background padding */

/* Button Padding */
.px-4.py-2  /* Horizontal and vertical button padding */

/* Gap Between Elements */
.space-x-3  /* Between icon and text */
.gap-2      /* Between button icon and text */
.space-y-6  /* Between major sections */

/* Margin */
.mt-1       /* Small margin for subtitles */
.mb-1       /* Small margin for labels */
```

---

## 🔧 Utility Classes Cheat Sheet

### Rounded Corners
- `rounded-xl` - Icon containers (12px)
- `rounded-lg` - Buttons (8px)
- `rounded-2xl` - Cards (16px)

### Shadows
- `shadow-xl` - Standard cards
- `shadow-2xl` - Hero sections, hover state

### Borders
- `border border-gray-100` - Subtle card borders
- `border-2 border-red-200` - Alert cards

### Overflow
- `overflow-hidden` - All cards (for gradient borders)

### Text Weights
- `font-bold` - All headers and numbers
- `font-medium` - Secondary text

### Transitions
- `transition-all duration-300` - Card animations
- `transition-all duration-200` - Button hovers

---

## 🎨 Custom Colors in Tailwind Config

Make sure these are defined in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'luxury-navy': '#1E3A8A',
        'luxury-gold': '#D4AF37',
      }
    }
  }
}
```

---

## ✅ Design Checklist

When creating a new report section, ensure:

- [ ] Card has `rounded-2xl shadow-xl border border-gray-100`
- [ ] Header has gradient background appropriate to content type
- [ ] Icon is wrapped in glass-effect container (`bg-white/20 backdrop-blur-sm`)
- [ ] Title is `text-2xl font-bold text-white`
- [ ] Subtitle exists with context/count (e.g., "30 records found")
- [ ] Subtitle uses color-200 shade of gradient color
- [ ] Export button uses glass effect (`bg-white/20 hover:bg-white/30`)
- [ ] Content area has `p-6` padding
- [ ] Hover animations are present where appropriate
- [ ] All text on colored backgrounds is white
- [ ] Colors match the purpose (success=green, alert=red, etc.)

---

## 🚀 Usage Example

```jsx
import { BarChart3, Download } from 'lucide-react';

// Beautiful Chart Section
<div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <div className="bg-gradient-to-r from-luxury-navy to-indigo-900 p-6">
    <div className="flex items-center justify-between text-white">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">Revenue Overview</h3>
          <p className="text-indigo-200 text-sm mt-1">Last 30 days</p>
        </div>
      </div>
      <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 flex items-center gap-2">
        <Download className="w-4 h-4" />
        Export
      </button>
    </div>
  </div>
  <div className="p-6">
    {/* Your chart here */}
  </div>
</div>
```

---

## 📚 References

- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/
- Glass Morphism: https://css.glass/
- Color Psychology: Professional hotel/luxury brand standards

**Use this guide to maintain consistency across all reports and dashboard sections!** 🎨✨

# Glassmorphism Form Styling Guide for SkyNest Hotel

This guide provides the exact CSS classes and styling needed to apply the beautiful glassmorphism effect (blur and transparency) to all modal forms in the SkyNest Hotel application, matching the "Add New Service" modal design.

## 🎨 Visual Reference

The target design features:
- **Blurred semi-transparent background overlay**
- **Glassmorphic modal container** with backdrop blur
- **Semi-transparent input fields** with subtle borders
- **Professional depth and layering** with proper shadows
- **Smooth hover and focus states**

---

## 📋 Complete Modal Wrapper Structure

### 1. Modal Overlay (Backdrop)

```jsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
```

**Key Classes Breakdown:**
- `fixed inset-0` - Full screen overlay
- `bg-black/50` - 50% transparent black background
- `backdrop-blur-sm` - Blur effect on background content
- `flex items-center justify-center` - Center the modal
- `z-50` - High z-index to stay on top
- `p-4` - Padding for mobile responsiveness

### 2. Modal Container (Glassmorphic Card)

```jsx
<div className="bg-surface-secondary dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50">
```

**Key Classes Breakdown:**
- `bg-surface-secondary dark:bg-slate-800/90` - Semi-transparent background (90% opacity)
- `backdrop-blur-xl` - Strong blur effect for glassmorphism
- `rounded-2xl` - Large rounded corners (1rem)
- `shadow-2xl` - Deep shadow for depth
- `max-w-2xl w-full` - Responsive width
- `max-h-[90vh] overflow-y-auto` - Scrollable if content is tall
- `border border-slate-700/50` - Subtle semi-transparent border

---

## 🎯 Form Input Field Styling

### Standard Input Field

```jsx
<input
  type="text"
  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400
             focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30
             hover:border-slate-500 transition-all duration-200 outline-none"
  placeholder="Enter value..."
/>
```

**Key Classes Breakdown:**
- `w-full px-4 py-3` - Full width with comfortable padding
- `bg-slate-700/40` - Semi-transparent dark background (40% opacity)
- `backdrop-blur-md` - Medium blur for glassmorphism
- `border-2 border-slate-600/70` - Semi-transparent border
- `rounded-lg` - Rounded corners
- `text-white placeholder-slate-400` - Text colors
- `focus:bg-slate-700/60` - Slightly more opaque on focus
- `focus:border-blue-500` - Blue border on focus
- `focus:ring-4 focus:ring-blue-500/30` - Glowing ring effect
- `hover:border-slate-500` - Lighter border on hover
- `transition-all duration-200` - Smooth transitions
- `outline-none` - Remove default outline

### Select Dropdown

```jsx
<select
  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white
             focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30
             hover:border-slate-500 transition-all duration-200 outline-none appearance-none cursor-pointer"
>
  <option value="">Select an option</option>
</select>
```

### Textarea

```jsx
<textarea
  rows="4"
  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400
             focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30
             hover:border-slate-500 transition-all duration-200 outline-none resize-vertical"
  placeholder="Enter description..."
/>
```

### Checkbox with Glassmorphism

```jsx
<label className="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    className="w-5 h-5 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded
               checked:bg-blue-500 checked:border-blue-500 cursor-pointer transition-all"
  />
  <span className="text-slate-300 font-medium">Active (Available for booking)</span>
</label>
```

---

## 🎨 Modal Header & Footer Styling

### Modal Header

```jsx
<div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 z-10">
  <div className="flex justify-between items-center">
    <h2 className="text-2xl font-bold text-white font-display">
      Add New Service
    </h2>
    <button
      onClick={onClose}
      className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200"
    >
      <X className="w-6 h-6" />
    </button>
  </div>
</div>
```

**Key Features:**
- `sticky top-0 z-10` - Sticky header when scrolling
- `bg-slate-800/60 backdrop-blur-lg` - Glassmorphic background
- `border-b border-slate-700/50` - Subtle divider

### Modal Footer (Action Buttons)

```jsx
<div className="px-6 py-5 border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky bottom-0 z-10">
  <div className="flex gap-3 justify-end">
    <button
      type="button"
      onClick={onClose}
      className="px-6 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 text-slate-300 font-semibold rounded-lg
                 hover:bg-slate-700/60 hover:border-slate-500 hover:text-white
                 transition-all duration-200"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg
                 hover:from-blue-600 hover:to-blue-700
                 disabled:opacity-50 disabled:cursor-not-allowed
                 shadow-lg shadow-blue-500/30
                 transition-all duration-200"
    >
      {loading ? 'Creating...' : 'Create Service'}
    </button>
  </div>
</div>
```

---

## 📝 Form Label Styling

```jsx
<label className="block text-sm font-semibold text-slate-300 mb-2">
  Service Name <span className="text-red-400">*</span>
</label>
```

---

## 🎯 Complete Modal Example

Here's a complete example of a glassmorphic modal form:

```jsx
import { useState } from 'react';
import { X } from 'lucide-react';

const GlassmorphicModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    unit_price: '',
    tax_rate: 0,
    active: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Your submit logic here
      await submitForm(formData);
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    {/* Backdrop Overlay */}
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      {/* Modal Container */}
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white font-display">
              Add New Service
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Text Input Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Service Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400
                         focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30
                         hover:border-slate-500 transition-all duration-200 outline-none"
              placeholder="e.g., RMSERV, LAUNDRY, SPA"
              required
            />
          </div>

          {/* Another Text Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Service Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400
                         focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30
                         hover:border-slate-500 transition-all duration-200 outline-none"
              placeholder="e.g., Room Service, Laundry, Spa"
              required
            />
          </div>

          {/* Text Input for Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400
                         focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30
                         hover:border-slate-500 transition-all duration-200 outline-none"
              placeholder="e.g., Food & Beverage, Housekeeping"
            />
          </div>

          {/* Number Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Unit Price <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.unit_price}
              onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400
                         focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30
                         hover:border-slate-500 transition-all duration-200 outline-none"
              placeholder="0.00"
              required
            />
          </div>

          {/* Number Input for Tax Rate */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.tax_rate}
              onChange={(e) => setFormData({...formData, tax_rate: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400
                         focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30
                         hover:border-slate-500 transition-all duration-200 outline-none"
              placeholder="0"
            />
          </div>

          {/* Checkbox */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="w-5 h-5 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded
                           checked:bg-blue-500 checked:border-blue-500 cursor-pointer transition-all"
              />
              <span className="text-slate-300 font-medium">Active (Available for booking)</span>
            </label>
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky bottom-0 z-10">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 text-slate-300 font-semibold rounded-lg
                         hover:bg-slate-700/60 hover:border-slate-500 hover:text-white
                         transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg
                         hover:from-blue-600 hover:to-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg shadow-blue-500/30
                         transition-all duration-200"
            >
              {loading ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GlassmorphicModal;
```

---

## 🔧 Quick Copy-Paste Classes

### Input Field (Single Line)
```
w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none
```

### Modal Overlay
```
fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4
```

### Modal Container
```
bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50
```

### Cancel Button
```
px-6 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 text-slate-300 font-semibold rounded-lg hover:bg-slate-700/60 hover:border-slate-500 hover:text-white transition-all duration-200
```

### Submit Button
```
px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200
```

---

## 🎨 Color Palette Reference

### Backgrounds
- Modal overlay: `bg-black/50`
- Modal container: `bg-slate-800/90`
- Input fields: `bg-slate-700/40`
- Header/Footer: `bg-slate-800/60`

### Borders
- Default: `border-slate-600/70`
- Hover: `border-slate-500`
- Focus: `border-blue-500`
- Dividers: `border-slate-700/50`

### Text
- Primary: `text-white`
- Secondary: `text-slate-300`
- Placeholder: `placeholder-slate-400`
- Tertiary: `text-slate-400`

### Backdrop Blur Levels
- Overlay: `backdrop-blur-sm`
- Container: `backdrop-blur-xl`
- Inputs: `backdrop-blur-md`
- Header/Footer: `backdrop-blur-lg`

---

## ✅ Checklist for Converting Existing Modals

For each modal in your application, update the following:

1. [ ] **Overlay wrapper**: Add `backdrop-blur-sm` and `bg-black/50`
2. [ ] **Modal container**: Replace solid background with `bg-slate-800/90 backdrop-blur-xl`
3. [ ] **Input fields**: Replace with glassmorphic input classes
4. [ ] **Borders**: Use semi-transparent borders (`border-slate-600/70`)
5. [ ] **Header**: Add `bg-slate-800/60 backdrop-blur-lg`
6. [ ] **Footer**: Add `bg-slate-800/60 backdrop-blur-lg`
7. [ ] **Buttons**: Apply new button styles with proper hover states
8. [ ] **Focus states**: Add ring effects (`focus:ring-4 focus:ring-blue-500/30`)
9. [ ] **Transitions**: Add `transition-all duration-200` for smooth animations

---

## 📱 Responsive Considerations

The glassmorphism design is fully responsive:

- Modal container uses `max-w-2xl w-full` for flexible sizing
- `p-4` on overlay provides mobile padding
- `max-h-[90vh] overflow-y-auto` ensures scrolling on small screens
- Sticky header/footer remain visible during scroll

---

## 🚀 Performance Tips

1. **Backdrop blur** can be performance-intensive on older devices. Test on target devices.
2. Use **opacity values** (e.g., `/40`, `/60`, `/90`) for transparency
3. Keep **transition durations** reasonable (200ms-300ms)
4. **Sticky headers** improve UX for long forms

---

## 🎯 Files to Update

Apply this styling to all modal components:

- `CreateBookingModal.jsx`
- `BookingDetailsModal.jsx`
- `CheckInModal.jsx`
- `CheckoutModal.jsx`
- `RoomAssignmentModal.jsx`
- `CreatePaymentModal.jsx`
- `PaymentAdjustmentModal.jsx`
- `RoomAvailabilityModal.jsx`
- `RegistrationModal.jsx`
- `CreateModal.jsx` (common component)
- Any other modal/form components

---

## 💡 Pro Tips

1. **Consistency**: Use the same blur and opacity values throughout
2. **Contrast**: Ensure text remains readable on glassmorphic backgrounds
3. **Layering**: Use different opacity levels to create depth
4. **Animations**: Smooth transitions enhance the premium feel
5. **Testing**: Always test in both light and dark modes

---

## 🔄 Migration Example

**Before:**
```jsx
<div className="fixed inset-0 bg-black bg-opacity-50">
  <div className="bg-white rounded-lg p-6">
    <input className="border border-gray-300 rounded p-2" />
  </div>
</div>
```

**After:**
```jsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6">
    <input className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none" />
  </div>
</div>
```

---

## 📖 Additional Resources

- **Tailwind Backdrop Blur**: https://tailwindcss.com/docs/backdrop-blur
- **Tailwind Opacity**: https://tailwindcss.com/docs/opacity
- **Glassmorphism Design**: https://uxdesign.cc/glassmorphism-in-user-interfaces

---

**Created for SkyNest Hotel Management System**
Version: 1.0
Last Updated: October 2025

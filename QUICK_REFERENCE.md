# Glassmorphism Quick Reference Card

## 🎯 Copy-Paste Classes

### Modal Structure

```jsx
// Overlay
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

  // Container
  <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50">

    // Header
    <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 z-10">
      <h2>Modal Title</h2>
      <button>Close</button>
    </div>

    // Body
    <form className="p-6 space-y-5">
      {/* Fields here */}
    </form>

    // Footer
    <div className="px-6 py-5 border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky bottom-0 z-10">
      <div className="flex gap-3">
        {/* Buttons here */}
      </div>
    </div>

  </div>
</div>
```

---

## 📝 Form Elements

### Text Input
```jsx
<input
  type="text"
  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
/>
```

### Number Input
```jsx
<input
  type="number"
  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
/>
```

### Date Input
```jsx
<input
  type="date"
  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
/>
```

### Textarea
```jsx
<textarea
  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none resize-vertical"
  rows="3"
/>
```

### Select Dropdown
```jsx
<select className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none appearance-none cursor-pointer">
  <option>Option 1</option>
</select>
```

### Checkbox
```jsx
<label className="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    className="w-5 h-5 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded checked:bg-blue-500 checked:border-blue-500 cursor-pointer transition-all"
  />
  <span className="text-slate-300 font-medium">Label Text</span>
</label>
```

---

## 🔘 Buttons

### Cancel Button
```jsx
<button
  type="button"
  className="px-6 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 text-slate-300 font-semibold rounded-lg hover:bg-slate-700/60 hover:border-slate-500 hover:text-white transition-all duration-200 flex-1"
>
  Cancel
</button>
```

### Submit Button
```jsx
<button
  type="submit"
  disabled={loading}
  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200 flex-1"
>
  {loading ? 'Submitting...' : 'Submit'}
</button>
```

### Close Button (X)
```jsx
<button
  onClick={onClose}
  className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200"
>
  <X className="w-6 h-6" />
</button>
```

---

## 🏷️ Labels

```jsx
<label className="block text-sm font-semibold text-slate-300 mb-2">
  Field Label <span className="text-red-400">*</span>
</label>
```

---

## 🎨 Colors Reference

| Element | Color Class | Hex/RGBA |
|---------|-------------|----------|
| Overlay BG | `bg-black/50` | rgba(0, 0, 0, 0.5) |
| Container BG | `bg-slate-800/90` | rgba(30, 41, 59, 0.9) |
| Input BG | `bg-slate-700/40` | rgba(51, 65, 85, 0.4) |
| Border Default | `border-slate-600/70` | rgba(71, 85, 105, 0.7) |
| Border Hover | `border-slate-500` | rgb(100, 116, 139) |
| Border Focus | `border-blue-500` | rgb(59, 130, 246) |
| Text Primary | `text-white` | rgb(255, 255, 255) |
| Text Secondary | `text-slate-300` | rgb(203, 213, 225) |
| Placeholder | `text-slate-400` | rgb(148, 163, 184) |

---

## ⚡ Blur Levels

- **Overlay:** `backdrop-blur-sm` (small blur)
- **Container:** `backdrop-blur-xl` (extra large blur)
- **Header/Footer:** `backdrop-blur-lg` (large blur)
- **Inputs:** `backdrop-blur-md` (medium blur)

---

## 📦 Complete Modal Template

```jsx
import { X } from 'lucide-react';

const MyModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Submit logic
      onSuccess();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Modal Title</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Field 1 */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Field Label <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.field1}
              onChange={(e) => setFormData({...formData, field1: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
              placeholder="Enter value"
              required
            />
          </div>

          {/* Field 2 */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Another Field
            </label>
            <textarea
              value={formData.field2}
              onChange={(e) => setFormData({...formData, field2: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none resize-vertical"
              placeholder="Enter description"
              rows="3"
            />
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky bottom-0 z-10">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 text-slate-300 font-semibold rounded-lg hover:bg-slate-700/60 hover:border-slate-500 hover:text-white transition-all duration-200 flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200 flex-1"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyModal;
```

---

## ✅ Quick Checklist

When updating a modal:

- [ ] Add `backdrop-blur-sm` to overlay
- [ ] Replace container background with `bg-slate-800/90 backdrop-blur-xl`
- [ ] Add `border border-slate-700/50` to container
- [ ] Update header with glassmorphic styling
- [ ] Replace all `input-field` classes with full glassmorphism classes
- [ ] Add `resize-vertical` to textareas
- [ ] Update button styles
- [ ] Add sticky footer with blur
- [ ] Test focus states (should show blue ring)
- [ ] Test hover states (borders should lighten)
- [ ] Verify mobile responsiveness

---

**Print this card and keep it handy while updating modals!**

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';

const CreateModal = ({ 
  isOpen, 
  onClose, 
  title, 
  fields, 
  onSubmit, 
  loading = false,
  submitText = "Create"
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      await onSubmit(formData);
      setFormData({});
      onClose();
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors({ general: error.message || 'An error occurred' });
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-md">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'select' ? (
                  <SearchableDropdown
                    options={(field.options || []).map((option) => ({
                      id: String(option?.value ?? option?.id ?? option),
                      name: option?.label ?? option?.name ?? String(option?.value ?? option),
                    }))}
                    value={formData[field.name] ?? ''}
                    onChange={(value) => handleChange(field.name, value)}
                    placeholder={field.placeholder || `Select ${field.label}`}
                    className="w-full"
                    clearable={!field.required}
                    required={field.required}
                    buttonClassName={`!px-3 !py-2 !rounded-md ${
                      errors[field.name]
                        ? '!border-red-600 focus-visible:!ring-red-500'
                        : '!border-border dark:border-slate-600'
                    }`}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field.name] ? 'border-red-600' : 'border-border dark:border-slate-600'
                    }`}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field.name] ? 'border-red-600' : 'border-border dark:border-slate-600'
                    }`}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                  />
                )}
                
                {errors[field.name] && (
                  <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 bg-surface-tertiary rounded-md hover:bg-slate-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {submitText}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateModal;

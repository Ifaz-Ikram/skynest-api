export const toast = {
  success: (message) => {
    console.log('✅ Success:', message);
    // Can be replaced with a toast library like react-hot-toast
    alert(`✅ ${message}`);
  },
  error: (message) => {
    console.error('❌ Error:', message);
    alert(`❌ ${message}`);
  },
  info: (message) => {
    console.log('ℹ️ Info:', message);
    alert(`ℹ️ ${message}`);
  },
  warning: (message) => {
    console.warn('⚠️ Warning:', message);
    alert(`⚠️ ${message}`);
  },
};

export default toast;

// Simple toast utility using browser's native capabilities
// For production, consider using a library like sonner or react-hot-toast

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // Create toast element
  const toastEl = document.createElement('div')
  toastEl.textContent = message
  toastEl.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium z-50 animate-slide-in ${
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    'bg-blue-600'
  }`
  toastEl.style.animation = 'slideIn 0.3s ease-out'

  document.body.appendChild(toastEl)

  // Remove after 3 seconds
  setTimeout(() => {
    toastEl.style.animation = 'slideOut 0.3s ease-out'
    setTimeout(() => {
      document.body.removeChild(toastEl)
    }, 300)
  }, 3000)
}

export function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    // For now, use native confirm
    // TODO: Replace with custom dialog component
    resolve(window.confirm(message))
  })
}

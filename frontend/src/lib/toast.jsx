import React from 'react'

const ToastCtx = React.createContext({ push: () => {} })

export function ToastProvider({ children }) {
  const rootRef = React.useRef(null)

  React.useEffect(() => {
    let el = document.getElementById('toasts')
    if (!el) {
      el = document.createElement('div')
      el.id = 'toasts'
      el.className = 'toasts'
      document.body.appendChild(el)
    }
    rootRef.current = el
  }, [])

  const push = React.useCallback((message, { type = 'success', title = '' } = {}) => {
    const root = rootRef.current
    if (!root) return
    const el = document.createElement('div')
    el.className = `toast ${type}`
    el.innerHTML = `<div class="title">${title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice')}</div>
                    <div class="msg">${message}</div>`
    root.appendChild(el)
    setTimeout(() => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(5px)'
      setTimeout(() => el.remove(), 300)
    }, 3000)
  }, [])

  return <ToastCtx.Provider value={{ push }}>{children}</ToastCtx.Provider>
}

export function useToast() {
  return React.useContext(ToastCtx)
}


import { io } from 'socket.io-client'
import { API_BASE } from './api'

function getSocketUrl() {
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL
  if (explicitSocketUrl) return explicitSocketUrl

  if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
    return API_BASE.replace(/\/api\/?$/, '')
  }

  return 'https://smart-interviewss.onrender.com'
}

const socket = io(getSocketUrl(), {
  autoConnect: true,
  transports: ['websocket', 'polling'],
})

export default socket

import { useEffect, useState } from 'react'
import socket from '../lib/socket'

export function useSocketLive() {
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('connecting')

  useEffect(() => {
    socket.on('connect', () => setStatus('connected'))
    socket.on('disconnect', () => setStatus('disconnected'))
    socket.on('menu-update', (payload) => setEvents((prev) => [payload, ...prev].slice(0, 8)))
    socket.on('feedback-update', (payload) => setEvents((prev) => [payload, ...prev].slice(0, 8)))
    socket.on('announcement', (payload) => setEvents((prev) => [payload, ...prev].slice(0, 8)))

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('menu-update')
      socket.off('feedback-update')
      socket.off('announcement')
    }
  }, [])

  return { events, status }
}

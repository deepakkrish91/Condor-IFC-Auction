import { useEffect, useRef, useCallback } from 'react'

export function useAuctionSocket(onMessage) {
  const wsRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws/auction`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onMessageRef.current(data)
      } catch {}
    }

    ws.onclose = () => {
      setTimeout(connect, 2000) // auto-reconnect
    }

    return ws
  }, [])

  useEffect(() => {
    const ws = connect()
    return () => ws.close()
  }, [connect])
}

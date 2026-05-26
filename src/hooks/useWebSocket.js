import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export function useWebSocket(destination, onMessage) {
  const clientRef = useRef(null)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      onConnect: () => {
        client.subscribe(destination, (msg) => onMessage(JSON.parse(msg.body)))
      },
    })
    client.activate()
    clientRef.current = client
    return () => client.deactivate()
  }, [destination])

  const send = (dest, body) => clientRef.current?.publish({ destination: dest, body: JSON.stringify(body) })

  return { send }
}

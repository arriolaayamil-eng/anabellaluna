import { useEffect, useRef } from 'react';
import socketService from '../services/socketService';

export function useSocket(eventHandlers = {}) {
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    let registered = false;

    socketService.connect().then((socket) => {
      if (!socket) return;
      registered = true;

      Object.entries(handlersRef.current).forEach(([event, handler]) => {
        socketService.on(event, handler);
      });
    });

    return () => {
      if (registered) {
        Object.entries(handlersRef.current).forEach(([event, handler]) => {
          socketService.off(event, handler);
        });
      }
    };
  }, []);
}

export default useSocket;

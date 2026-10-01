import { io } from 'socket.io-client';

const SOCKET_URL = 'https://unitedcabsmerthyr.uk'; // your socket server url (no /api)

const Socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 10000,
  autoConnect: true,   // ✅ IMPORTANT
});

export default Socket;

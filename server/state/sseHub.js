'use strict';

/**
 * Bộ điều phối kết nối Server-Sent Events (SSE) dùng chung cho toàn máy chủ.
 */
let sseClients = [];

function addSseClient(res) {
  sseClients.push(res);
  return sseClients.length;
}

function removeSseClient(res) {
  sseClients = sseClients.filter((client) => client !== res);
}

function getClientCount() {
  return sseClients.length;
}

function broadcastSSE(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(msg);
    } catch (_err) {
      // Bỏ qua client đã đóng socket đột ngột
    }
  });
}

function closeAllSseClients() {
  sseClients.forEach((client) => {
    try {
      client.end();
    } catch (_err) {}
  });
  sseClients = [];
}

module.exports = {
  addSseClient,
  removeSseClient,
  getClientCount,
  broadcastSSE,
  closeAllSseClients
};

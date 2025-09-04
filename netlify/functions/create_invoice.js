exports.handler = async (event) => {
  // Solo para probar que la Function existe
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok: true, method: event.httpMethod, note: "function reachable" })
  };
};

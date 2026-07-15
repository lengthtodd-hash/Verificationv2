const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.json(undefined);
});
const server = app.listen(3001, async () => {
  const res = await fetch('http://localhost:3001/');
  const text = await res.text();
  console.log("TEXT:", text);
  server.close();
});

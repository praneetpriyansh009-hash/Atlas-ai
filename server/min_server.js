import express from 'express';
const app = express();
app.get('/test', (req, res) => res.json({ status: 'ok' }));
app.listen(5000, () => console.log('Minimal server on 5000'));

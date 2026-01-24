import express from 'express';
console.log('Express imported successfully');
const app = express();
app.get('/test', (req, res) => res.send('ok'));
app.listen(5000, () => {
    console.log('Direct test server listening on 5000');
    process.exit(0);
});

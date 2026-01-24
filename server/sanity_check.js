import express from 'express';
const app = express();
const PORT = 5001; // Use a different port for sanity check
app.get('/', (req, res) => res.send('OK'));
app.listen(PORT, () => {
    console.log(`Sanity Check server running on port ${PORT}`);
    process.exit(0);
});

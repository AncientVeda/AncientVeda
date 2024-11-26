const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Test läuft!');
});

app.listen(5001, () => {
    console.log('Server läuft auf Port 5001');
});


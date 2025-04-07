const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

let clients = [];
let notificationsCount = 0;

app.get('/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    const pingInterval = setInterval(() => {
        res.write('event: Ping\n');
        res.write('data: {}\n\n');
    }, 1000);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
        clearInterval(pingInterval);
    });
});

const sendEventToAll = (event, data) => {
    clients.forEach(client => {
        client.res.write(`event: ${event}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};

app.post('/send-message', (req, res) => {
    const { text, sender } = req.body;
    if (!text || !sender) {
        return res.status(400).json({ error: 'text и sender обязательны' });
    }

    const message = {
        text,
        sender,
        timestamp: new Date().toISOString(),
    };

    sendEventToAll('ChatMessage', message);
    res.status(200).json({ success: true, message });
});

app.post('/increment-notifications', (req, res) => {
    notificationsCount += 1;

    const payload = {
        count: notificationsCount,
        timestamp: new Date().toISOString(),
    };

    sendEventToAll('NotificationsAvailable', payload);
    res.status(200).json({ success: true, payload });
});

app.listen(PORT, () => {
    console.log(`SSE-сервер запущен на http://localhost:${PORT}`);
});

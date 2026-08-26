const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Main Portfolio route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Template', 'index.html'));
});

app.use('/todo', express.static(path.join(__dirname, 'public', 'todo-app')));

app.get('/todo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'todo-app', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at: http://localhost:${port}`);
});

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('SkyNest API is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

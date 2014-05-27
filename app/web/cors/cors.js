var forward = require('./forward.js');
var express = require('express');
var cors = require('cors');
var app = express();
// instantiate `app` et al

app.use(cors());
app.use(forward(/\/(.*)/));

app.listen(1234);
var PORT = 6677;
var express = require('express');

var app = express();

app
   .use(express.static('statics'))
   .get('/', function(req, res){
      res.send({ some: 'json' });
   });

app.listen(PORT);

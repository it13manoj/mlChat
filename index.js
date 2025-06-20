const express = require('express');
const http = require('http');
const app = express();


app.get("/api",(req,res)=>{
  res.status(200).send("We are working")
})



http.createServer(app).listen(8080,()=>{
 console.log('Server running on http://localhost:8080');
})


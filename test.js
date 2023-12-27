const bcrypt= require("bcryptjs")
const express = require('express')
const app = express()
const password = 'mypassword';
const saltRounds = 10; // Adjust as needed for security and performance

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error(err);
  } else {
    hash2=hash;
    console.log(hash); // Store this hash in your database
  }
});

setTimeout(() => {
    bcrypt.compare('mypassword', hash2, (err, result) => {
        if (err) {
          console.error(err);
        } else {
          console.log(result); // true if passwords match, false otherwise
        }
      });
    
}, 1000);

app.get('/', (req, res) => {
    res.send("hehe")
  })

  app.listen(4000,()=>{
    console.log("running at http://localhost:3000")
})
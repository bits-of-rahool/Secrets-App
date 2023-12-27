//imports
const dotenv = require("dotenv").config()
const express = require('express')
const ejs = require("ejs")
const bodyParser= require("body-parser")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate")
const ObjectId = require('mongodb').ObjectId; 
//configs
const app = express()
app.use(express.static("public"))
app.set("view engine","ejs")
app.use(bodyParser.urlencoded({extended:true}))

// sets the express-session as the session manager
app.use(session({  
  secret:"The Secret", //encrypts session with this key
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

// mongoose connection
mongoose.connect(process.env.MONGO_URI)

const schema= new mongoose.Schema({
  email: String,
  password:String,
  googleId:String,
  secret:String
});

schema.plugin(passportLocalMongoose); //plugging in localpassport
schema.plugin(findOrCreate)

const User=  mongoose.model("User",schema);

passport.use(User.createStrategy()) // This tells Passport to use the authentication strategy provided by the User model (local strategy in this case).

// The createStrategy() method, provided by passportLocalMongoose, sets up the local strategy for finding users in the database and comparing passwords.

// passport.serializeUser(User.serializeUser()); serialization cookie making.            serializeUser() this is a passport-local-mongoose method.
// passport.deserializeUser(User.deserializeUser()); deserialization cookie breaking

passport.serializeUser(function(user, done) {
  done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
  done(null, user);
  });


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile)
  User.findOrCreate({  username: profile.displayName,googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

//GET requests...
app.get('/', (req, res) => {
  res.render("home")
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/login', (req, res) => {
  res.render("login")
})

app.get('/submit',(req,res)=>{
  if(req.isAuthenticated()){
    res.render("submit")
   }     
   else{
    res.redirect("login")
   }
})

app.get('/register', (req, res) => {
  res.render("register")
})


app.get("/logout",(req,res)=>{
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
})


app.get('/secrets',async (req, res) => {
  
  const secrets=await User.find({secret:{$ne:null}})
  
  res.render("secrets",{secrets:secrets})
})

app.get("/logout",(req,res)=>{
  console.log("logged out")
  res.redirect("/login")
})

app.get('/auth/google/secrets',
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
  res.redirect('/secrets');
});

//POST requests...
app.post('/register', (req, res) => {
//registering User
User.register({username:req.body.username},req.body.password,(err,user)=>{
  if(err){
    console.log(err)
    res.redirect("/register")
  }
  else{
      passport.authenticate("local")(req,res,()=>{
        res.redirect("/secrets");
      });
  }
})
})

app.post("/submit",async (req,res)=>{
  const secret=req.body.secret;
  const id=await req.user._id
  var o_id = new ObjectId(id);
  const onemore = await User.updateOne({_id:o_id},{secret:secret})
  res.render("submit")
})

app.post('/login', (req, res) => {
  const user = new User({
    username:req.body.username,
    password:req.body.password
  })

req.login(user,(err)=>{
  if(err){
    console.log(err)
    res.redirect("/login")
  }
  else{
    passport.authenticate("local")(req,res,()=>{
      console.log("authenticated")
      res.redirect("/secrets");
    });
  }
})
})


app.listen(3000,()=>{
    console.log("running at http://localhost:3000")
}) 
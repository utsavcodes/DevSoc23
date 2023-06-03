const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const MongoDBStore = require('connect-mongodb-session')(session);
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

app.set('views', path.join(__dirname, '/public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set("view engine", 'ejs');
app.use(express.static('public'));

const mongoURI = 'mongodb://127.0.0.1:27017/prostech';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("MongoDB Connected");
});

const UserModel = require('./models/user');
const ProdModel = require('./models/product');

const store = new MongoDBStore({
  uri: mongoURI,
  collection: "mysessions",
});



app.use(session({
  secret: "Key assigned",
  resave: false,
  saveUninitialized: false,
  store: store,
}));



const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect('/login');
  }
};




app.get("/", function(req, res) {
  res.render('home');
});

app.get("/profile", function(req, res) {
  res.render('profile');
});





app.get("/login", function(req, res) {
  if (req.session.isAuth) {
    res.redirect('/scan');
  } else {
    res.render('login');
  }

});




app.post("/login", async function(req, res) {

  const email = req.body.email;
  const password  = req.body.password;

  const user = await UserModel.findOne({ Email: email });

  if (!user) {
    return res.redirect('/login');
  }

  const isMatch = await bcrypt.compare(password, user.Password);
  if (!isMatch) {
    return res.redirect('.');
  }
  req.session.name = user.Name;
  req.session.isAuth = true;
  res.redirect('/scan');
});




app.get("/register", function(req, res) {

  res.render('register');
});




app.post("/register", async function(req, res) {
  const name = req.body.name;
  const age = req.body.age;
  const dob = req.body.dob;
  const gender = req.body.gender;
  const amputation = req.body.amputation;
  const email = req.body.email;
  const password = req.body.password;

  let user = await UserModel.findOne({ Email: email });
  if (user) {
    return res.redirect('/login');
  }

  const hashedPsw = await bcrypt.hash(password, 14);
  user = new UserModel({
    Name: name,
    Email: email,
    Password: hashedPsw,
    Age: age,
    Amputation: amputation,
    Dob: dob,
    Gender: gender,
  });

  console.log("Saved!");

  await user.save();
  res.redirect('/login');
});





app.get("/scan", isAuth, async function(req, res) {
  let prod = await ProdModel.find({});
  res.render('scan',{name:req.session.name, data:prod});
});




app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});





app.listen(5000, () => {
  console.log("Listening to the server on http://localhost:5000");
});












// const express = require('express');
// const session = require('express-session');
// const bcrypt = require('bcryptjs');
// const mongoDBSession = require('connect-mongodb-session')(session);
// const app = express();
// const bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static('public'));
// app.set("view engine", 'ejs');


// const mongoURI = 'mongodb://127.0.0.1:27017/prostech'
// const mongoose = require('mongoose');
// const MongoDBStore = require('connect-mongodb-session');
// mongoose.connect(mongoURI,{
//   useNewUrlParser:true,
//   useUnifiedTopology: true,
// }).then((res)=>{
//   console.log("Mongodb Connected");
// })


// const UserModel = require('./models/user')
// const store = new mongoDBSession({
//   uri: mongoURI,
//   collection: "mysessions",
// });



// app.use(session({
//   secret: "Key assigned",
//   resave: false,
//   saveUninitialized: false,
//   store: store,
// }));


// const isAuth = (req,res,next)=>{
//   if(req.session.isAuth){
//     next()
//   }
//   else{
//     res.redirect('/login');
//   }
// }


// app.get("/", function(req, res) {

//   res.render('home');

// });



// app.get("/login", function(req, res) {
 
//   res.render('login');

// });



// app.post("/login", async function(req, res) {
//   const {email,password} = req.body;

//   const user = await UserModel.findOne({email});

//   if(!user){
//     return res.redirect('/login');
//   }
//   const isMatch = await bcrypt.compare(password,user.password);

//   if(!isMatch){
//     return res.redirect('/login');
//   }

//   req.session.isAuth = true;

//   res.redirect('/dashboard'); 
// });



// app.get("/register", function(req, res) {
 
//   res.render('register');

// });



// app.post("/register", async function(req, res) {

//   const name = req.body.name;
//   const age = req.body.age;
//   const dob = req.body.dob;
//   const gender = req.body.gender;
//   const amputation = req.body.amputation;
//   const email = req.body.email;
//   const password = req.body.password;


//   let user = await  UserModel.findOne({email});
//   if(user){
//     return res.redirect('.')
//   }
//   const hashedpsw = await bcrypt.hash(password,12);

//   user = new UserModel({
//     Name: name,
//     Email: email,
//     password: hashedpsw,
//     Age: age,
//     Amputation: amputation,
//     Dob: dob,
//     Gender: gender,
//   });

//   console.log("Saved!");

//   await user.save();
//   res.redirect('login');

// });




// app.get("/dashboard", isAuth ,function(req, res) {

//   res.render('dashboard');

// });



// app.post('/logout',(req,res)=>{
//   req.session.destroy((err)=>{
//     if(err) throw err;
//     res.redirect("/");
//   });
// });



// app.listen(5000, () => {
//   console.log("Listening to the server on http://localhost:5000");
// });
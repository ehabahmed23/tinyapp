const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser')

// lsof -i :8000 -t 
// kill number

app.set("view engine", "ejs");

//middlewear used
app.use(express.urlencoded({ extended: true })); // creates req.body to read
app.use(cookieParser()) // creates req.cookies

// helper functions
function generateRandomString() {
  const result = Math.random().toString(36).substring(7);
  return result
};

const findUserByEmail = (email, users) => {
  // for (let key in database)
    for (let id in users) {
      const user = users[id]; // => retrieve the value that's in id 
      if (user.email === email) {
        return user;
      }
    }
    return false;
};

// database for urls and users
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  user01: {
    id: "user01",
    email: "a@a.com",
    password: "hello",
  },
  user02: {
    id: "user02",
    email: "b@b.com",
    password: "1234",
  },
};



// to listen for a connection
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// shows our database as a JSON file
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// routes all my urls page
app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  const templateVars = { 
    urls: urlDatabase,
    user
   };
  res.render("urls_index", templateVars);
});

// route for adding new urls page
app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  res.render("urls_new", {user});
});

// this get format /urls/:id. The : in front of id indicates that id is a route parameter. 
// This means that the value in this part of the url will be available in the req.params object.
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const id = req.params.id
  const longURL = urlDatabase[id]
  
  const templateVars = { id, longURL, user};
  res.render("urls_show", templateVars);
});

// post request for adding a new url and sendin you to that page after
app.post("/urls", (req, res) => {
  const longURl = req.body.longURL  // get the long url from body
  const shortURL = generateRandomString()  // add it to database with short url

  urlDatabase[shortURL] = longURl;

  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);   // redirect to new urlpage
});

// this will send you to the actual website attached to the shorturl
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// checks the short url you want to delete and goes into database and deletes it and send you back to urls page
app.post("/urls/:id/delete", (req, res) => {
 const id = req.params.id
  console.log(urlDatabase[id])
  delete urlDatabase[id]
  res.redirect("/urls");
});

// takes the new long url inputed and the current short url and replaces that in the database
app.post("/urls/:id", (req, res) => {
const newlongURL = req.body.longURL // the new long URL you inputed
const id = req.params.id // this is the id stored in the URL

urlDatabase[id] = newlongURL // reassign it to this shortURL
// redirect back to urls page
res.redirect("/urls");
});

//adds username to all pages headers
app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  res.render("urls_index", { user });
});

//------------------------------------Registration page--------------------------------
app.get("/register", (req, res) => {
  const templateVars = {
    user: null //since we haven't logged in yet here, user would be null here
  };
  res.render("register", templateVars);
  res.status(404);
});

app.post("/register", (req, res) => { //when I submit register form I want the info to be receive that info from
  // Extract the user info from the incoming form after client clicks register -- using req.body (body parser of express)
  const email = req.body.email; //this matches the email attribute form the register form
  const password = req.body.password; 

  //handle registration errors - if email and/or password are blank
  if (email === "" || password === "") {
    return res.status(400).send("Please enter a valid email address and/or password");
  }
  //handle registration errors - if email already exists-- use function we created above ---- moved to helper functions
    const user = findUserByEmail(email,users);
    // ^we want to find the user using their email through the users object
    if (user) { //if user already exists then no need to create a new user
      res.status(403).send('Sorry, user already exists!');
      return;
    }

  //generate a new user id
  const id = generateRandomString();
  //create new user AND add their name, email, password to our users database
  const newUser = { //This endpoint should add a new user object to the global users object
    id: id,
    email: email,
    password: password
  }
  // add the new user to our users obj database (i.e. we need to ascribe it to a key value and in our case the random generated string)
  users[id] = newUser //we want it to be equal to new user object above 
  //set the cookie-- we want to the browser keep the user id in the cookie
  res.cookie("user_id", id); //test cookie in browser
  //redirect to '/urls'
  console.log(users);
  res.redirect("/urls");
});

//---------------------Login--------------------------
app.get("/login", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  res.render("login", { user });
});

app.post("/login", (req, res) => {
  const email = req.body.email //grab email from body
  const password = req.body.password // grab password

  const user = findUserByEmail(email, users); // check if user is in users db
  if (user && user.password === password) { // if user does exist and password matches

    //we want broswer to store the user id in a cookie
    res.cookie("user_id", user.id) //set cookie to their user id 
    res.redirect("/urls");
    return;
  };

  //user is not authenticated
  res.status(403).send("Could not find an account associated with that email. Please register and create an account.")
});

// clears cookie when you logout
app.post("/logout", (req, res) => {

  res.clearCookie("user_id")
  res.redirect("/login")
});
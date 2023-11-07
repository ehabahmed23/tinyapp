const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session')
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const {
  generateRandomString,
  findUserByEmail,
  urlsForUser
} = require('./helpers');

// lsof -i :8000 -t 
// kill number

app.set("view engine", "ejs");

//middlewear used
app.use(express.urlencoded({ extended: true })); // creates req.body to read
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))


// database for urls and users
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  user01: {
    id: "user01",
    email: "a@a.com",
    password: bcrypt.hashSync("hello", salt),
  },
  user02: {
    id: "user02",
    email: "b@b.com",
    password: bcrypt.hashSync("1234", salt),
  },
};




app.get("/", (req, res) => {
  const user_id = req.session.user_id;
  
  if (!user_id) {   
    return res.redirect("/login"); //if user is not logged in: redirect to /login
  } else {      
    res.redirect("/urls"); //if user is logged in: redirect to /urls
  }
});

// shows our database as a JSON file
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// routes all my urls page
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  
  if (user_id) {
    let urlList = urlsForUser(user_id, urlDatabase)
    const templateVars = { 
      urls: urlList,
      user
    };
    res.render("urls_index", templateVars);
  } else {
    res.send("<html><body><b>You must be logged in to see urls. <a href='/login'>click here to login!</a></b></body></html>\n");
  }
});

// route for adding new urls page
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];

  if (!user_id) {    //if we do not have a user logged in, then redirect them to the login page
    return res.redirect("/login");
  } else {
    res.render("urls_new", { user });
  }
});

// this get format /urls/:id. The : in front of id indicates that id is a route parameter. 
// This means that the value in this part of the url will be available in the req.params object.
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const id = req.params.id
  const longURL = urlDatabase[id].longURL
  
  if (userId) {
    let urlList = urlsForUser(userId, urlDatabase)
    if (urlList.hasOwnProperty(id)) { //if short URL is assigned to valid longURl, redirects to page
      const templateVars = { id, longURL, user};
      res.render("urls_show", templateVars);
    } else {
      res.send("<html><body><b>TinyURL doesn't match your UserID</b></body></html>\n");
    }
  } else {
    res.send("<html><body><b>You must be logged in to see urls</b></body></html>\n");
  }
  
});

// post request for adding a new url and sendin you to that page after
app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const longURL = req.body.longURL
  
  if (user_id) {
    const newShortURL = generateRandomString(); 
    const newLongURL = {
      longURL: longURL,
      userID: user_id
    }; 
    
    //need to add the user to the database as well so it's linked to the newURL
    urlDatabase[newShortURL] = newLongURL;  //this gives random string id to the new long URL that client provided
    
    res.redirect(`/urls/${newShortURL}`);//will redirect to the longURL page of that randomstring
    
    
  } else {   // a non-logged in user cannot add a new url
    res.status(403).send("Sorry but you cannot access this page if you are not logged. Please log in or register for an account");
  }
});

// this will send you to the actual website attached to the shorturl
app.get("/u/:id", (req, res) => {
  //check to see if URL exists
  console.log(!urlDatabase["th"]);
  if (urlDatabase.hasOwnProperty(req.params.id)) { //if short URL is assigned to valid longURl, redirects to page
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  } else {
    return res.status(404).send('<html>This short url does not exist!</a></html>');
  }
  
});

// checks the short url you want to delete and goes into database and deletes it and send you back to urls page
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id
  const user_id = req.session.user_id;
  
  console.log(user_id)
  
  if (urlDatabase.hasOwnProperty(id))  {
    if (user_id) {
      let urlList = urlsForUser(user_id, urlDatabase)
      if (urlList.hasOwnProperty(id)) {
        delete urlDatabase[id];
        res.redirect("/urls");
      } else {
        return res.status(404).send('<html>This user does not own this url!</a></html>');
      }
    } else {
      return res.status(404).send('<html>User is not logged in!</a></html>');
    }
} else {
  return res.status(404).send('<html>This id does not exist!</a></html>');
}

});

// takes the new long url inputed and the current short url and replaces that in the database
app.post("/urls/:id", (req, res) => {
  const newlongURL = req.body.longURL // the new long URL you inputed
  const id = req.params.id // this is the id stored in the URL
  const user_id = req.session.user_id;
  
  if (urlDatabase.hasOwnProperty(id))  {
    if (user_id) {
      let urlList = urlsForUser(user_id, urlDatabase)
      if (urlList.hasOwnProperty(id)) {
        urlDatabase[id].longURL = newlongURL
        res.redirect("/urls");
      } else {
        return res.status(404).send('<html>This user does not own this url!</a></html>');
      }
    } else {
      return res.status(404).send('<html>User is not logged in!</a></html>');
    }
  } else {
  return res.status(404).send('<html>This id does not exist!</a></html>');
}

});

//------------------------------------Registration page--------------------------------
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = {
    user: null //since we haven't logged in yet here, user would be null here
  };
  if (!user_id) {    // if a user is not logged in, it should take them to registeration page
    res.render("register", templateVars); // render registration page
    
  } else {     //if logged in, they should see the url page ************** check again
    res.redirect("/urls");
  }
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
    password: bcrypt.hashSync(password, salt)
  }
  // add the new user to our users obj database (i.e. we need to ascribe it to a key value and in our case the random generated string)
  users[id] = newUser //we want it to be equal to new user object above 
  console.log(users);  //set the cookie-- we want to the browser keep the user id in the cookie
  req.session.user_id = id;
  // res.cookie("user_id", id); //test cookie in browser
  //redirect to '/urls'
  res.redirect("/urls");
});

//---------------------Login--------------------------
app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  
  if (!user_id) {   // if a user is not logged in, it should take them to login page

    res.render("login", {user}); // render registration page
    
  } else {     //if logged in, they should see the url page 
    res.redirect("/urls");
  }
});


app.post("/login", (req, res) => {
  const email = req.body.email //grab email from body
  const password = req.body.password // grab password
  const user = findUserByEmail(email, users); // check if user is in users db
  
  if (email === "" || password === "") {
    return res.status(400).send("Please ensure both fields are filled. Enter both a valid email address and/or password.");
  }
  
  if (user && !bcrypt.compareSync(password, user.password)) {
    res.send("Please type in the correct password associated with this account.");
  }
  
  if (user && bcrypt.compareSync(password, user.password)) { // if user does exist and password matches
    
    //we want broswer to store the user id in a cookie
    req.session.user_id = user.id; //set cookie to their user id 
    res.redirect("/urls");
    return;
  };
  
  //user is not authenticated
  res.status(403).send("Could not find an account associated with that email. Please register and create an account.")
});

// clears cookie when you logout
app.post("/logout", (req, res) => {
  
  req.session = null;
  
  res.redirect("/urls")
});



// to listen for a connection
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
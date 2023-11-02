const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser')

//middlewear used
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

function generateRandomString() {
  const result = Math.random().toString(36).substring(7);
  return result
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"]
   };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"]
   };
  res.render("urls_new", templateVars);
});

/*
this get format /urls/:id. The : in front of id indicates that id is a route parameter. 
This means that the value in this part of the url will be available in the req.params object.
*/
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"]};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  // get the long url from body
  const longURl = req.body.longURL
  // add it to database with short url
  const shortURL = generateRandomString()
  urlDatabase[shortURL] = longURl;
  // redirect to new urlpage
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`); // Respond with 'Ok' (we will replace this)
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  id = req.params.id
  console.log(urlDatabase[id])
  delete urlDatabase[id]
  res.redirect("/urls");
});
 
app.post("/urls/:id", (req, res) => {
// take new long URL
const newlongURL = req.body.longURL
const id = req.params.id
// reassign it to this shorturl 
urlDatabase[id] = newlongURL
// redirect back to urls page
res.redirect("/urls")
});

// post request for login
app.post("/login", (req, res) => {
  console.log(req.body)
  res.cookie("username", req.body.username)
  res.redirect("/urls");
});

//adds username to all pages headers
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    // ... any other vars
  };
  res.render("urls_index", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("username")
  res.redirect("/urls")
});
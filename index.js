const express = require("express")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const session = require("express-session")
require("dotenv").config()

let db = process.env.DATABASE
let DB_username = process.env.DB_USER
let DB_password = process.env.DB_PASSWORD

let port = process.env.PORT
const app = express()

mongoose.connect(
  "mongodb+srv://" +
    DB_username +
    ":" +
    DB_password +
    "@cluster0.n1prx7y.mongodb.net/" +
    db
)

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
)
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: "false" }))
app.use(express.json())

let User = require("./models/user_schema")
let Message = require("./models/contact_schema")

function getUsername(req) {
  if (req.session.username == "Doctor") {
    return "Doctor"
  } else {
    return req.session.username ? req.session.username : ""
  }
}

app.get("/", (req, res) => {
  res.render("pages/homepage", {
    title: "Veterinary clinic Pet care",
    username: getUsername(req),
  })
})

app.get("/contact-us", (req, res) => {
  res.render("pages/contact-us", {
    title: "Contact us",
    username: getUsername(req),
  })
})

app.post("/contact-us", async (req, res) => {
  await Message.create({
    name: req.body.contactName,
    email: req.body.contactEmail,
    type: req.body.contactType,
    textMessage: req.body.textMessage,
  })
  res.render("./pages/success-message", {
    message: "Successfully sent message!",
  })
})

app.get("/services", (req, res) => {
  res.render("pages/services", {
    title: "Services",
    username: getUsername(req),
  })
})

app.get("/news", (req, res) => {
  res.render("pages/news", { title: "News", username: getUsername(req) })
})

app.get("/doctor-dashboard", async (req, res) => {
  const messages = await Message.find().sort({ name: "desc" })
  res.render("pages/doctor-dashboard", {
    title: "Dashboard",
    username: getUsername(req),
    messages,
  })
})

app.post("/doctor-dashboard", async (req, res) => {
  await Message.deleteMany({})
  res.redirect("/doctor-dashboard")
})

app.get("/log-in", (req, res) => {
  res.render("pages/log-in", { title: "Log in", username: getUsername(req) })
})

app.post("/log-in", async (req, res) => {
  const user = await User.findOne({ username: req.body.username }).exec()
  if (user != null && user.username != "Doctor") {
    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (result == true) {
        req.session.username = req.body.username
        res.redirect("/services")
      } else {
        res.render("./pages/wrong-password", {
          errorMessage: "Wrong password",
        })
      }
    })
  } else if (user != null && user.username == "Doctor") {
    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (result == true) {
        req.session.username = req.body.username
        res.redirect("/doctor-dashboard")
      } else {
        res.render("./pages/wrong-password", {
          errorMessage: "Wrong password",
        })
      }
    })
  } else {
    res.render("./pages/error-user", { errorMessage: "User does not exist" })
  }
})

app.get("/register", (req, res) => {
  res.render("pages/register", {
    title: "Register",
    username: getUsername(req),
  })
})

app.post("/register", async (req, res) => {
  const user = await User.findOne({ username: req.body.username }).exec()
  if (user != null) {
    res.render("./pages/error", { errorMessage: "User already exists" })
  }
  let saltRounds = 10
  if (req.body.password === req.body.password2) {
    await bcrypt.genSalt(saltRounds, (err, salt) => {
      bcrypt.hash(req.body.password, salt, (err, hashedPassword) => {
        User.create({
          username: req.body.username,
          password: hashedPassword,
        })
        res.render("./pages/success-register", {
          message: "Successfully registered account!",
        })
      })
    })
  } else {
    res.render("./pages/error", { errorMessage: "Passwords do not match" })
  }
})

app.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
})

app.listen(port, () => {
  console.log("Server started on port " + port)
})

const User = require('../models/user')
const bcrypt = require("bcrypt")

const SessionsController = {
  New: (req, res) => {
    res.render("sessions/new", {title: "Acebook - Log in"});
  },

  Create: (req, res) => {
    console.log("trying to log in");
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email: email }).then((user) => {
      if (!user) {
        res.redirect("/");
      } else if (bcrypt.compareSync(password, user.password) == false) {
        res.redirect("/");
      } else {
        req.session.user = user;
        res.redirect("/posts");
      }
    });
  },

  Destroy: (req, res) => {
    console.log("logging out");
    if (req.session.user && req.cookies.user_sid) {
      res.clearCookie("user_sid");
    }
    res.redirect("/");
  },
};

module.exports = SessionsController;

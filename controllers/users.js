const User = require("../models/user");
const Post = require("../models/post");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const UsersController = {

  Update:(req, res) => {

    if (req.session.user._id == req.params.id) { 
      return res.status(201).redirect(`/users/${req.params.id}`)
    };

    User.findOne({_id: req.session.user._id })
    .then((user) => { 
      if (!user) { return res.status(404).send("Not Found") } 

      if (user.friends.includes(req.params.id)){
        return res.status(201).redirect(`/users/${req.params.id}`) // Already friends
      }

      user.friends.push(req.params.id)
      user.save()

      User.findOne({_id: req.params.id })
      .then((other_user) => { 
      if (!other_user) { return res.status(404).send("Not Found") } 

      other_user.friends.push(req.session.user._id)
      other_user.save()
      })

      res.status(201).redirect(`/users/${req.params.id}`);
    })
    .catch((err) => {
      res.status(404).send(`Error - ${err}`)
    })

  },

  Index: (req, res) => {
    
    if (!req.query.q){ 
      res.status(200).send("Nothing to see here") 
      return
    }
    
    User.find({ "name": { "$regex": req.query.q, "$options": "i" } },
      function(err, users) { 
        if (err) {
          throw err
        }

        res.render("users/index", { users: users})
      })
  },

  Show: (req, res) => {
    var showAddFriend = true

    // this allows viewing of a profile when not logged in
    const sessionUserId = typeof(req.session.user) == "undefined"  ? 0 : req.session.user._id
    console.log("Session User ID", sessionUserId)
    console.log("User Id to Friend", req.params.id)
    if (sessionUserId == req.params.id || sessionUserId == 0) {
      showAddFriend = false
    }

    User.
      findOne({_id: req.params.id }).
      populate('friends').
      populate('posts').
      exec (function (err, user){
        if (err) throw err;
        if (!user) { return res.status(404).send("Not Found") } 

        user.friends.forEach((friend) => {
          if (friend.id == sessionUserId){showAddFriend = false}
        })
 
        console.log(showAddFriend)
        res.render("users/show", { user: user, posts: user.posts, users: user.friends , showAddFriend : showAddFriend });
      })

  },

  Upload: (req, res) => {
    console.log("Inside Upload")

    User.findOne({ _id: req.session.user._id }).then((user) => {

      user.profilePic.data = fs.readFileSync(path.join('./uploads/' + req.file.filename))
      
      user.profilePic.contentType = 'image/jpeg'
    
      user.save((err) => {
        if (err) {
          throw err
        }
      })
      res.status(201).redirect(`/users/${req.session.user._id}`);
    })
  },

  New: (req, res) => {
    res.render("users/new", {title: "Acebook - Sign up"});
  },

  Create: (req, res) => {

    const hash = bcrypt.hashSync(req.body.password, saltRounds);
    req.body.password = hash

    const user = new User(req.body);

    user.profilePic.data = fs.readFileSync('./public/images/blank_profile.jpg')
    user.profilePic.contentType = 'image/jpeg'

    user.save((err) => {
      if (err) {
        throw err;
      }
      req.session.user = user;
     
      res.status(201).redirect("/posts");
    });
  },

};

module.exports = UsersController;

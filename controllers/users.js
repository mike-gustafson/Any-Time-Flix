// Imports
require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { JWT_SECRET } = process.env;

// DB Models
const User = require("../models/user");

// Controllers
router.get("/test", (req, res) => {
  res.json({ message: "User endpoint OK! ✅" });
});

router.post("/signup", (req, res) => {
  // POST - adding the new user to the database
  console.log("===> Inside of /signup");
  console.log("===> /register -> req.body", req.body);

  User.findOne({ email: req.body.email })
    .then((user) => {
      // if email already exists, a user will come back
      if (user) {
        // send a 400 response
        return res.status(400).json({ message: "Email already exists" });
      } else {
        // Create a new user
        const newUser = new User({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          userName: req.body.userName,
          city: req.body.city,
          state: req.body.state,
          country: req.body.country,
          email: req.body.email,
          password: req.body.password,
          bio: req.body.bio,
          profilePicture: req.body.profilePicture,
          ratings: [],
          watched: [],
          watchList: [],
          liked: [],
          disliked: [],
          playlists: [],
        });

        // Salt and hash the password - before saving the user
        bcrypt.genSalt(10, (err, salt) => {
          if (err) throw Error;

          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) console.log("==> Error inside of hash", err);
            // Change the password in newUser to the hash
            newUser.password = hash;
            newUser
              .save()
              .then((createdUser) => res.json({ user: createdUser }))
              .catch((err) => {
                console.log("error with creating new user", err);
                res.json({ message: "Error occured... Please try again." });
              });
          });
        });
      }
    })
    .catch((err) => {
      console.log("Error finding user", err);
      res.json({ message: "Error occured... Please try again." });
    });
});

// POST route for login
router.post('/login', async (req, res) => {

    // Find user by email in the db
    const foundUser = await User.findOne({ email: req.body.email });

    // If user exists in the db
    if (foundUser) {

      // Compare the submitted password with the password in the db      
      let isMatch = await bcrypt.compare(req.body.password, foundUser.password);

      // If password is a match, create a token and send to the client.
      if (isMatch) {
            // if user match, then we want to send a JSON Web Token
            // Create a token payload
            // add an expiredToken = Date.now()
            // save the user
            console.log(foundUser, 'foundUser')
            const payload = {
                id: foundUser.id,
                email: foundUser.email
            }
            
            jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
                if (err) {
                    res.status(400).json({ message: 'Session has ended, please log in again'});
                }
                const legit = jwt.verify(token, JWT_SECRET, { expiresIn: 60 });
                console.log('===> legit', legit);
                res.json({ success: true, token: `Bearer ${token}`, loginData: legit});
            });

        } else {
            // If password is not a match, send a 400 response with the message
            return res.status(400).json({ message: 'Incorrect Password' });
    }
  } else {
    return res.status(400).json({ message: "User not found" });
  }
});

// PUT route
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    userName,
    city,
    state,
    country,
    email,
    bio,
    profilePicture,
  } = req.body;
  try {
    let updatedUser = await User.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        userName,
        city,
        state,
        country,
        email,
        bio,
        profilePicture,
      },
      { new: true }
    );
    res.json(updatedUser);
  } catch (error) {
    console.log(error);
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  // find the user by their ID from the URL parameters
  const { id } = req.params;
  let deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) {
    return res.status(400).json({ message: "No user with that id" });
  } else {
    res.status(200).json({ message: "Successfully deleted user" });
  }
});

// private
router.get(
  "/profile/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    console.log("====> inside /profile");
    console.log(req.body);
    console.log("====> user");
    console.log(req.user);
    const { id, name, email } = req.user; // object with user object inside
    res.json({ id, name, email });
  }
);

router.get(
  "/email/:email",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    console.log("headers:", req.headers)
    console.log("====> inside /email");
    // console.log(req.body);
    console.log("====> user");
    // console.log(req.user);
    const userData = req.user;
    res.json({ userData });
  }
);

router.get(
  "/messages",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    console.log("====> inside /messages");
    console.log(req.body);
    console.log("====> user");
    console.log(req.user);
    const { id, name, email } = req.user; // object with user object inside
    const messageArray = [
      "message 1",
      "message 2",
      "message 3",
      "message 4",
      "message 5",
      "message 6",
      "message 7",
      "message 8",
      "message 9",
    ];
    const sameUser = await User.findById(id);
    res.json({ id, name, email, message: messageArray, sameUser });
  }
);

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, userName, city, state, country, email, bio, profilePicture } = req.body;
    try {
        let updatedUser = await User.findByIdAndUpdate(id, { firstName, lastName, userName, city, state, country, email, bio, profilePicture }, { new: true });
        res.json(updatedUser);
    } catch (error) {
        console.log(error);
    }
}
);

router.put("/addToList/:listName/:id", async (req, res) => {
  const { listName, id } = req.params;
  const { movie } = req.body; // Assuming 'movie' is an object
  console.log(listName, id, movie);
  try {
      let updatedUser = await User.findByIdAndUpdate(
          id,
          { $push: { [listName]: movie } },
          { new: true }
      );
      res.json(updatedUser);
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error updating user's list" });
  }
});

router.put("/removeFromList/:listName/:id", async (req, res) => {
  const { listName, id } = req.params;
  const { movie } = req.body;


  try {
      let updatedUser = await User.findByIdAndUpdate(
          id,
          { $pull: { [listName]: { id: movie.id } } }, // Remove based on movie ID
          { new: true }
      );
      res.json(updatedUser);
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error updating user's list" });
  }
});


// Exports
module.exports = router;

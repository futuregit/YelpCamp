var express = require("express");
var router = express.Router();
var passport    = require("passport");
var User        = require("../models/user");

//===========
//AUTH ROUTES
//===========

//root route
router.get("/", function(req, res){
    res.render("landing");
});
//show register form
router.get("/register", function(req,res){
    res.render("register");
});
//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", "Please try to re-enter a name and password.");
            return res.redirect("register");
        }
        passport.authenticate("local")(req, res, function(){
            console.log("I'm in welcome to YelpCamp")
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    } );
});
// show login form
router.get("/login", function(req,res){
    res.render("login");
});
//handling login logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: "Username and/or password is incorrect" 
}), function(req, res){
    res.send("Logic is hrouterening");
});

//logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out");
    res.redirect("/campgrounds");
});

module.exports = router;
var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var  weather = require('weather-js');
var unsplash = require('unsplash-api');
var NodeGeocoder = require('node-geocoder');
//Set up object for geocoding
var options = {
  provider: 'google',
// Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: process.env.GOOGLE_MAPS_API_KEY, // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};
var geocoder = NodeGeocoder(options);
//Providing client key to unsplash api
var clientId = process.env.CLIENTKEY; //this is required to verify your application's requests 
unsplash.init(clientId);

//INDEX - show all campgrounds
router.get("/", function(req, res){
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else {
           res.render("campgrounds/index",{campgrounds:allCampgrounds});
       }
    });
});
//Search for picture using unsplash api
router.post("/search",  middleware.isLoggedIn, function(req, res){
      unsplash.searchPhotos(req.body.imgsearch, null, null, 300, function(error, photos, link) {
          if(error) {
              console.log(error)
          } else {
          if(photos[0] === undefined){
               req.flash("error", "\"" + req.body.imgsearch.toUpperCase() + "\"" + " is not found. Please try another search.");
               res.redirect("/campgrounds/new") ;
          } else {
               res.render("campgrounds/pictures", {photo:photos});
          }
          }
    });
      
});
//Submit new Campground with values
router.post("/",  middleware.isLoggedIn, function(req, res){
    //Check to see if loc has been defined. If not then it only a image search
    //Possible move image search on it post with search in future
    //Several if statements. Try to improve code
    if (req.body.loc != undefined){
        weather.find({search: req.body.loc, degreeType: 'F'}, function(err, result) {
                    if(err) console.log(err);
                    //check to see if weather.find was unable to find location
                    if(result == undefined){
                        req.flash("error", "\"" + req.body.loc.toUpperCase() + "\"" + " Not found. Please try another location or a more specific location.");
                        res.redirect("/campgrounds/new");   
                    } else{
                             if(req.body.name != undefined) {
                                    // get data from form and add to campgrounds array
                                    var name = req.body.name;
                                    var image = req.body.image;
                                    var desc = req.body.description;
                                    var author = {
                                        id: req.user._id,
                                        username: req.user.username
                                    };
                                    var loc = req.body.loc;
                                    var price = req.body.price;
                                    var newCampground = {name: name, image: image, description: desc, author:author, loc:loc, price:price};
                                    
                                    // Create a new campground and save to DB
                                    Campground.create(newCampground, function(err, newlyCreated){
                                        if(err){
                                            console.log(err);
                                        } else {
                                            //redirect back to campgrounds page
                                            res.redirect("/campgrounds");
                                        }
                                    });
                             } else{
                                    res.render("campgrounds/new", {photo:req.body.photo, photoplaceholder:req.body.photo});
                             }
                    }
        }
        )} else {
            res.render("campgrounds/new", {photo:req.body.photo, photoplaceholder:req.body.photo});
        }
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
    var photoplaceholder = "image url";
    var photo = '';
    res.render("campgrounds/new", {photoplaceholder:photoplaceholder, photo:photo}); 
});
// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            geocoder.geocode(foundCampground.loc, function(err, data) {
            if(err){
                console.log(err);
            } else
            {
                res.render("campgrounds/show", {campground: foundCampground, datalat:data[0].latitude, datalong:data[0].longitude});
            }
            });
        }
    });
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit",middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
        }else {
        res.render("campgrounds/edit", {campground: foundCampground});
        }
        });
    
});
//UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
      weather.find({search: req.body.campground.loc, degreeType: 'F'}, function(err, result) {
                    if(err) console.log(err);
                    //check to see if weather.find was unable to find location
                    if(result == undefined){
                        req.flash("error", "\"" + req.body.campground.loc.toUpperCase() + "\"" + " Not found. Please try another location or a more specific location.");
                        res.redirect("/campgrounds/" + req.params.id + "/edit");
                    } else {
    //find and update the correct campground

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            res.redirect("/campgrounds");
        } else {
            //redirect somewhere(show page)
            res.redirect("/campgrounds/" + req.params.id);
        }
    });

                    }
});
});

//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
   Campground.findByIdAndRemove(req.params.id, function(err){
       if(err){
           res.redirect("/campgrounds");
       } else {
           res.redirect("/campgrounds");
       }
   });
});




module.exports = router;

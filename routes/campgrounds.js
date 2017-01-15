var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var  weather = require('weather-js');
var unsplash = require('unsplash-api');
//Set up object for geocoding
var NodeGeocoder = require('node-geocoder');
var options = {
  provider: 'google',
// Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: process.env.GOOGLE_MAPS_API_KEY, // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};
var geocoder = NodeGeocoder(options);

var clientId = 'ecf2584e04508acb9ba8c934fe09be930386c344f5856620303aef1d1b9c518e'; //this is required to verify your application's requests 
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
router.post("/search", function(req, res){
  
    unsplash.searchPhotos(req.body.imgsearch, null, null, 300, function(error, photos, link) {
          console.log(photos)
           if(photos[0] === undefined){
               req.flash("error", "\"" + req.body.imgsearch.toUpperCase() + "\"" + " is not found. Please try another search.");
               console.log(res)
               var relay = "Sorry no photos was found. Try another search."
               //Go back to the search
               res.redirect("/campgrounds/new") 
           } else {
       console.log(photos)
    res.render("campgrounds/pictures", {photo:photos});
           }
    });
})
// router.post("/pictures", function(req,res){
 
//       unsplash.searchPhotos(req.body.imgsearch, null, null, 300, function(error, photos, link) {
//           if(photos.length == 0){
//               var relay = "Sorry no photos was found. Try another search."
//               //Go back to the search
//               res.redirect("campgrounds/new", {relay: relay})
//           } else {
        
//     res.render("campgrounds/pictures", {photo:photos});
//           }
//       });
// });

router.post("/", function(req, res){
    if (req.body.loc != undefined){
    //console.log(req.body)
             weather.find({search: req.body.loc, degreeType: 'F'}, function(err, result) {
                console.log(result)
                console.log("Look above in post")
                
                if(result == undefined){
                    req.flash("error", "\"" + req.body.loc.toUpperCase() + "\"" + " Not found. Please try another location or a more specific location.")
                    res.redirect("/campgrounds/new")   
                    }  else{
    
                             if(req.body.name != undefined) {
                                    console.log(req.body.image)
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
                                            console.log(newlyCreated);
                                            res.redirect("/campgrounds");
                                        }
                                    });
                            } else{
                                //console.log(req.body.photo)
                                res.render("campgrounds/new", {photo:req.body.photo, photo2:req.body.photo});
                            }}
                                 }
)} else {
     res.render("campgrounds/new", {photo:req.body.photo, photo2:req.body.photo});
}
        
    });
//CREATE - add new campground to DB
// router.post("/", middleware.isLoggedIn, function(req, res){
//     // get data from form and add to campgrounds array
//     var name = req.body.name;
//     var image = req.body.image;
//     var desc = req.body.description;
//     var author = {
//         id: req.user._id,
//         username: req.user.username
//     };
//     var loc = req.body.loc;
  
//     var newCampground = {name: name, image: image, description: desc, author:author, loc:loc};
       
//     // Create a new campground and save to DB
//     Campground.create(newCampground, function(err, newlyCreated){
//         if(err){
//             console.log(err);
//         } else {
          
//             //redirect back to campgrounds page
//             console.log(newlyCreated);
//             res.redirect("/campgrounds");
//         }
//     });
//     });

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
    var photo = "image url"
    var photo2 = ''
    var relay = 'test'
   res.render("campgrounds/new", {photo:photo, photo2:photo2, relay:relay}); 
});
router.get("/pictures", function(req, res){
       unsplash.searchPhotos('church', null, null, 65, function(error, photos, link) {
           if(photos.length < 10){
               var relay = "Please try another search that will produce at least ten photos"
               //Go back to the search
           }
        console.log(photos.length);
    res.render("campgrounds/pictures", {photo:photos});
       });
});

// SHOW - shows more info about one campground
router.get("/:id", 
function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            // console.log(campground.ObjectId("5877c440334a9c5909744801").getTimestamp().toString().substring(4,15))
            geocoder.geocode(foundCampground.loc, function(err, data) {
            if(err){
                console.log(err);
            } else
            {
              //Need to check for undefined for some reason weather.find is able to return "undefined" in it callback
                console.log(foundCampground.loc)
            weather.find({search: foundCampground.loc, degreeType: 'F'}, function(err, result) {
               
            res.render("campgrounds/show", {campground: foundCampground, datalat:data[0].latitude, datalong:data[0].longitude});
                 
              
            });
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
    //find and update the correct campground
     
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            res.redirect("/campgrounds");
        } else {
            //redirect somewhere(show page)
            res.redirect("/campgrounds/" + req.params.id);
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

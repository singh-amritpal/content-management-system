//Author: Amritpal Singh

// importing dependencies
const express = require('express');
const path = require('path');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const session = require('express-session');
const fileUpload = require('express-fileupload');

// setup the database and making the connection
mongoose.connect('mongodb://localhost:27017/contentManagement', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// setting-up global variables to use packages
var myApp = express();
myApp.use(express.urlencoded({ extended: true }));

// setting-up path to public folders & view folders
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname + '/public'));

// setting-up EJS view engine
myApp.set('view engine', 'ejs');

// setting up express fileupload
myApp.use(fileUpload());

// setting up session
myApp.use(session({
    secret: 'supercalifragilisticexpialidocious',
    resave: false,
    saveUninitialized: true
}));

// defining 'Page' collection and setting up the model for the 'Page' collection
const Page = mongoose.model('Page', {
    pageTitle: String,
    pageImageName: String,
    pageDescription: String
})

// defining 'Admin' collection and setting up the model for the 'Admin' collection
const Admin = mongoose.model('Admin', {
    username: String,
    password: String,
    adminName: String
});

// setting up different  routes
//home
myApp.get('/', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        res.render('home', { pages: pages });
    });
});

//login
myApp.get('/login', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        res.render('login', { pages: pages });
    });
});

// login from post
myApp.post('/login', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        var username = req.body.username;
        var password = req.body.password;

        Admin.findOne({
            username: username,
            password: password
        }).exec(function (err, admin) {
            if (admin) {
                //store username in session and set logged in true
                req.session.username = admin.username;
                req.session.userLoggedIn = true;

                //redirect to dashboard
                res.render('dashboard', {
                    adminName: admin.adminName,
                    pages: pages
                });
            }
            else {
                res.render('login', {
                    pages: pages,
                    error: 'Invalid username or password. Please try again.'
                });
            }
        });
    });
});

//dashboard
myApp.get('/dashboard', function (req, res) {
    //check if user logged in
    if (req.session.userLoggedIn) {
        Admin.findOne({}).exec(function (err, admin) {
            console.log(err)
            res.render('dashboard', { admin: admin });
        });
    }
    else {  //otherwise send to login page
        res.redirect('/login');
    }
});

// allPages page
myApp.get('/allPages', function (req, res) {
    if (req.session.userLoggedIn) {
        Page.find({}).exec(function (err, pages) {
            res.render('allPages', { pages: pages });
        });
    }
    else {  //otherwise send to login page
        res.redirect('/login');
    }
});

// add page
myApp.get('/addPage', function (req, res) {
    if (req.session.userLoggedIn) {
        res.render('addPage');
    }
    else {  //otherwise send to login page
        res.redirect('/login');
    }
});

// add page post
myApp.post('/addPage', function (req, res) {
    var pageTitle = req.body.pageTitle;
    var pageDescription = req.body.pageDescription;

    //fetch and save the image only if image is uploaded
    if ((req.files && req.files.pageImageName)) {
        var pageImageName = req.files.pageImageName.name;
        var pageImageFile = req.files.pageImageName;
        var pageImagePath = 'public/uploads/' + pageImageName;
        pageImageFile.mv(pageImagePath, function (err) {
            console.log(err);
        });
    }

    var pageData = {
        pageTitle: pageTitle,
        pageImageName: pageImageName,
        pageDescription: pageDescription
    }

    //create new page
    var newPage = Page(pageData);

    //save the page
    newPage.save().then(function () {
        console.log('New Page Created Successfully...');
    });

    res.render('addSuccess', { message: 'New Page Created Successfully' })
});

// edit page
myApp.get('/editPage/:pageid', function (req, res) {
    if (req.session.userLoggedIn) {
        var pageid = req.params.pageid;

        Page.findOne({ _id: pageid }).exec(function (err, page) {
            if (page) {
                res.render('editPage', {
                    page: page
                });
            }
            else {
                res.send('404: Page not found.');
            }
        });
    }
    else {  //otherwise send to login page
        res.redirect('/login');
    }
});

// edit page post
myApp.post('/editPage/:pageid', function (req, res) {
    var pageTitle = req.body.pageTitle;
    var pageImageName = req.body.pageImageName;
    var pageDescription = req.body.pageDescription;

    var pageid = req.params.pageid;

    //fetch and save the image only if image is uploaded
    if ((req.files && req.files.pageImageName)) {
        var pageImageName = req.files.pageImageName.name;
        var pageImageFile = req.files.pageImageName;
        var pageImagePath = 'public/uploads/' + pageImageName;
        pageImageFile.mv(pageImagePath, function (err) {
            console.log(err);
        });
    }

    Page.findOne({ _id: pageid }, function (err, page) {
        page.pageTitle = pageTitle;
        page.pageImageName = pageImageName;
        page.pageDescription = pageDescription;

        page.save();
    });

    res.render('editSuccess', {
        message: 'Page Updated Successfully'
    });
});

//delete page
myApp.get('/deletePage/:pageid', function (req, res) {
    if (req.session.userLoggedIn) {
        var pageid = req.params.pageid;
        Page.findByIdAndDelete({ _id: pageid }).exec(function (err, page) {
            if (page) {
                res.render('deletePage', { message: 'Page Deleted Successfully' });
            }
            else {
                res.render('deletePage', { message: 'Sorry, Page could not be Deleted' });
            }
        });
    }
    else {  //otherwise send to login page
        res.redirect('/login');
    }
});

//logout page
myApp.get('/logout', function (req, res) {
    if (req.session.userLoggedIn) {
        Page.find({}).exec(function (err, pages) {
            req.session.username = '';
            req.session.userLoggedIn = false;
            res.render('login', { pages: pages, error: 'You have Successfully logged out' })
        });
    }
    else {  //otherwise send to login page
        res.redirect('/login');
    }
});

// created pages
myApp.get('/:pageid', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        var pageid = req.params.pageid;
        Page.findOne({ _id: pageid }).exec(function (err, page) {

            if (page) {
                res.render('viewPage', {
                    pageTitle: page.pageTitle,
                    pageImageName: page.pageImageName,
                    pageDescription: page.pageDescription,
                    pages: pages
                })
            }
            else {
                res.send('404: Unable to Find Your Page. Please Create One.');
            }
        });
    });
});

// start the server and listen at a port 8080
myApp.listen(8080);

// tell everything was ok
console.log('Everything executed fine.. website at http://localhost:8080/....');
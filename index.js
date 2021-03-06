const express = require("express"); 
const bodyParser = require("body-parser"); 
const mongoose = require("mongoose");
const methodOverride = require('method-override');
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("./model/User");
const EmployeeModel = require("./model/Employee");
const TipoutModel = require("./model/TipoutModel");
const passport = require("passport");

const app = express();

mongoose.connect("mongodb+srv://TJUser1:TexasJackMongoDB@cluster0.b04vt.mongodb.net/TESTDB?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(methodOverride('_method'));
app.use(require("express-session")({ 
    secret: "Texas Jacks Good BBQ", 
    resave: false, 
    saveUninitialized: false
}));

app.set('view engine', 'ejs'); 

app.use(passport.initialize()); 
app.use(passport.session()); 
passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser()); 


//Open login page
app.get("/", function(req, res){
    res.render("login");
});

//Process login
app.post("/login", passport.authenticate("local", { 
    successRedirect: "/home", 
    failureRedirect: "/login"
}));

//Open home page and display employees
app.get("/home", isLoggedIn, async function(req, res) {
    if (req.query.empID != null && req.query.empID !== ""){
        const Employee = await EmployeeModel.find({ID: req.query.empID})
        res.render("home", { Employees: Employee});
    } else if ((req.query.firstName != null && req.query.firstName !== "") && (req.query.lastName != null && req.query.lastName !== "")) {
        const Employee = await EmployeeModel.find({f_name: req.query.firstName, l_name: req.query.lastName})
        res.render("home", { Employees: Employee});
    } else{
        const Employee = await EmployeeModel.find()
        res.render("home", { Employees: Employee});
    }
    
});

app.post("/home", isLoggedIn, async function(req, res){
    const Employees = new EmployeeModel({
        ID: req.body.empID,
        f_name: req.body.firstName,
        l_name: req.body.lastName,
        nickname: req.body.nickname,
        def_pos: req.body.def_pos,
        active: req.body.active,
        cell_num: req.body.cell_num,
        hire_date: req.body.hire_date,
        email: req.body.email
    });
    try{
        const newEmployee = await Employees.save();
        res.redirect(`/${newEmployee.id}`);
    } catch {
            res.render("add", {
                Employees: Employees,
                errorMessage: "Error Creating Employee"
        
            });
    }
});

//Open settings page
app.get("/settings", isLoggedIn, function(req,res){
    res.render("settings");
});

//Open register page
app.get("/register", isLoggedIn, function(req,res){
    res.render("register");
})

//open tipout page 

app.get("/tipout", isLoggedIn, function(req,res){
    res.render("tipout");
})

//Process registration
app.post("/register", isLoggedIn, function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user) {
            if(err) {
                console.log(err);
                return res.render("register");
            }
            passport.authenticate("local") (req, res, function() {
                res.redirect("/home")
    });
});
});

//Logout of web app
app.get("/logout", isLoggedIn, function(req, res){
    req.logout();
    res.redirect("/");
})

//Add Employees
app.get("/add", isLoggedIn, function(req,res){
    res.render("add", { Employees: new EmployeeModel()});
});



//Employee Profile
app.get("/:id", isLoggedIn, async function(req, res) {
    try {
        const Employees = await EmployeeModel.findById(req.params.id);
        var Tipout = await TipoutModel.findOne({ID: Employees.ID}).exec();
        res.render("profile", { Employees: Employees, Tipout: Tipout});
    } catch (err){
        console.log(err);
    }
});

//Modify employee
app.get("/:id/modify", isLoggedIn, async function(req, res){
    try {
        const Employees = await EmployeeModel.findById(req.params.id);
        res.render("modify", { Employees: Employees });
    } catch {
        console.log(err);
    }
});


app.put("/:id", isLoggedIn, async function(req, res){
    let Employees;

    try {
        Employees = await EmployeeModel.findById(req.params.id);

        Employees.ID = req.body.empID;
        Employees.f_name = req.body.firstName;
        Employees.l_name = req.body.lastName;
        Employees.nickname = req.body.nickname;
        Employees.def_pos = req.body.def_pos;
        Employees.active = req.body.active;
        Employees.cell_num = req.body.cell_num;
        Employees.hire_date = req.body.hire_date;
        Employees.email = req.body.email;

        await Employees.save();
        res.redirect(`/${Employees.id}`);
    } catch {
        if (Employees == null) {
            res.redirect("home");
        }
        else {
            res.render("modify", {
                Employees: Employees,
                errorMessage: "Error Modifying Employee"
            });
        }
    }
});

//Delete employee
app.delete("/:id", isLoggedIn, async function(req, res){
    let Employees
    try {
        Employees = await EmployeeModel.findById(req.params.id)
        await Employees.remove()
        res.redirect("home")
    } catch {
        if (Employees == null) {
            res.redirect("home");
        }
        else {
            res.redirect(`/${Employees.id}`);
        }
    }
});



//Checks to see if user is logged in
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/");
}

app.listen(3000, function() {
    console.log("Server started on port 3000");
});
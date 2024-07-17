//Importing dependencies:

require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const _ = require("lodash")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

//Setting up the modules to use them

const app = express()
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"))

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/tradeDB")

//Defining Schemas:
const adminSchema = new mongoose.Schema({
    email: String,
    password: String,
})

adminSchema.plugin(passportLocalMongoose)

const Admin = mongoose.model("Admin", adminSchema)

passport.use(Admin.createStrategy())

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    Admin.findById(id).exec()
        .then(user => done(null, user))
        .catch(err => done(err, null))
})

const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    image: String,
    price: Number,
    stock: Number
})

const Product = mongoose.model("Product", productSchema)


// //HardCoding the values of product and saving it into db for testing only
// const products = [
//     { name: "Product 1", description: "Description for Product 1", price: 100, image: "/images/pencil.jpg", stock: 10},
//     { name: "Product 2", description: "Description for Product 2", price: 150, image: "/images/books.jpg", stock: 10 },
//     { name: "Product 3", description: "Description for Product 3", price: 200, image: "/images/colorpencil.jpg", stock: 10 },
//     { name: "Product 4", description: "Description for Product 4", price: 250, image: "/images/waterbottle.jpg", stock: 10 },
//     { name: "Product 5", description: "Description for Product 5", price: 300, image: "/images/highlighter.jpg", stock: 10 },
//     { name: "Product 6", description: "Description for Product 6", price: 350, image: "/images/calc.jpg", stock: 10 },
//     { name: "Product 7", description: "Description for Product 7", price: 400, image: "/images/bag.jpg", stock: 10 },
//     { name: "Product 8", description: "Description for Product 8", price: 450, image: "/images/pins.jpg", stock: 10 }
// ];

// // Function to save the products to the database
// const saveProducts = async () => {
//     try {
//         // Create instances of the Product model and save them
//         for (let i = 0; i < products.length; i++) {
//             const product = new Product(products[i]);
//             await product.save();
//         }
//         console.log("Products saved successfully.");
//     } catch (error) {
//         console.error("Error saving products:", error)
//     }
// }

// // Call the function to save the products
// saveProducts()

// Middleware to handle requests for favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204));

//Routing and rendering:

app.get("/", function(req, res){
    res.render("home")
})

app.get("/login", function(req, res){
    res.render("admin-login")
})

app.get("/products", function(req, res) {

    Product.find()
    .then((foundProducts)=>{
        res.render("products", { products: foundProducts });
    })
    .catch((err)=>{
        console.log(err);
    })

});

app.get("/products/:productName", function(req, res){
    const requestedProduct = req.params.productName

    Product.findOne({name: requestedProduct})
        .then((foundProduct)=>{
            res.render("product",{product: foundProduct })
        })
        .catch((err)=>{
            console.log(err);
        })
})

app.get("/:renderFile", function(req, res){

    const requestFile = _.lowerCase(req.params.renderFile)
    res.render(requestFile)
})

app.get("/admin/dashboard", function(req,res){
    if (req.isAuthenticated()){
        Product.find()
        .then((foundProducts)=>{
            res.render("admin-dashboard", { products: foundProducts });
        })
        .catch((err)=>{
            console.log(err);
        });
    } else {
        res.redirect("/login");
    }
})

app.get("/admin/modify/:productId", function(req, res){
    if (req.isAuthenticated()){
        Product.findById(req.params.productId)
        .then((foundProduct)=>{
            res.render("admin-modify", { product: foundProduct });
        })
        .catch((err)=>{
            console.log(err);
        });
    } else {
        res.redirect("/login");
    }
});

// Admin.register({username: "admin"}, "admin", function(err, user){
//     if (err){
//         console.log(err)
//     } else {
//         console.log("Successfully admin added!")
//     }
// })

app.post("/login", function(req, res){

    const admin = new Admin({
        email: _.lowerCase(req.body.username),
        password: _.lowerCase(req.body.password)
    });

    req.login(admin, function(err){
        if (err){
            console.log("Login Error:", err)
            res.redirect("/login")
        } else {
            passport.authenticate("local")(req, res, function(){
                console.log("Authenticated successfully!")
                res.redirect("/admin/dashboard")
            });
        }
    });
})

app.post("/admin/modify/:productId", function(req, res){
    if (req.isAuthenticated()){
        Product.findByIdAndUpdate(req.params.productId, {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            stock: req.body.stock
        })
        .then(()=>{
            res.render("status", { message: "Successfully updated" });
        })
        .catch((err)=>{
            console.log(err);
            res.render("status", { message: "Error updating product" });
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/admin/delete/:productId", function(req, res){
    if (req.isAuthenticated()){
        Product.findByIdAndDelete(req.params.productId)
        .then(()=>{
            res.render("status", { message: "Successfully deleted" });
        })
        .catch((err)=>{
            console.log(err);
            res.render("status", { message: "Error deleting product" });
        });
    } else {
        res.redirect("/login");
    }
});





//Spinning the app with a port
app.listen(3000, function(){
    console.log("Server started on port 3000");
});
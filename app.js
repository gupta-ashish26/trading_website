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
const multer = require("multer")
const fs = require("fs")
const path = require("path")

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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })

adminSchema.plugin(passportLocalMongoose)

const Admin = mongoose.model("Admin", adminSchema)

passport.use(Admin.createStrategy())

passport.serializeUser(function(user, done) {
    done(null, user.id)
})

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

const orderSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    contact: String,
    email: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    country: String,
    zip: String,
    items: [
        {
            productId: mongoose.Schema.Types.ObjectId,
            name: String,
            price: Number,
            quantity: Number
        }
    ],
    totalPrice: Number,
    date: { type: Date, default: Date.now }
})

const Order = mongoose.model("Order",orderSchema)

// Middleware to calculate cart item count
app.use(function (req, res, next) {
    const cart = req.session.cart || [];
    res.locals.cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
    next();
});

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
// ]

// // Function to save the products to the database
// const saveProducts = async () => {
//     try {
//         // Create instances of the Product model and save them
//         for (let i = 0; i < products.length; i++) {
//             const product = new Product(products[i])
//             await product.save()
//         }
//         console.log("Products saved successfully.")
//     } catch (error) {
//         console.error("Error saving products:", error)
//     }
// }

// // Call the function to save the products
// saveProducts()

// Middleware to handle requests for favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204))

//Routing and rendering:

app.get("/", function(req, res){
    res.render("home")
})

app.get("/login", function(req, res){
    res.render("admin-login")
})

app.get("/logout", function(req, res){
    req.logout(function(err) {
        if (err) { return next(err) }
        res.redirect("/login")
    })
})


app.get("/products", function(req, res) {

    Product.find()
    .then((foundProducts)=>{
        res.render("products", { products: foundProducts })
    })
    .catch((err)=>{
        console.log(err)
    })

})

app.get("/products/:productName", function(req, res){
    const requestedProduct = req.params.productName

    Product.findOne({name: requestedProduct})
        .then((foundProduct)=>{
            res.render("product",{product: foundProduct })
        })
        .catch((err)=>{
            console.log(err)
        })
})

// Route to display cart items
app.get("/cart", function(req, res) {
    const cart = req.session.cart || [] // Initialize cart as empty array if not exists

    res.render("cart", { cart: cart })
})

// Route to render checkout page
app.get("/checkout", function (req, res) {
    res.render("checkout", { cart: req.session.cart })
})

app.get("/:renderFile", function(req, res){

    const requestFile = _.lowerCase(req.params.renderFile)
    res.render(requestFile)
})

app.get("/admin/dashboard", function(req,res){
    if (req.isAuthenticated()){
        Product.find()
        .then((foundProducts)=>{
            res.render("admin-dashboard", { products: foundProducts })
        })
        .catch((err)=>{
            console.log(err)
        })
    } else {
        res.redirect("/login")
    }
})

app.get("/admin/upload", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("admin-upload");
    } else {
        res.redirect("/login");
    }
})

app.get("/admin/modify/:productId", function(req, res){
    if (req.isAuthenticated()){
        Product.findById(req.params.productId)
        .then((foundProduct)=>{
            res.render("admin-modify", { product: foundProduct })
        })
        .catch((err)=>{
            console.log(err)
        });
    } else {
        res.redirect("/login")
    }
})

app.get("/admin/orders", function (req, res) {
    Order.find({})
        .then(orders => {
            res.render("order-history", { orders: orders });
        })
        .catch(err => {
            console.error(err);
            res.render("status", { message: "Error fetching orders." });
        });
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
    })

    req.login(admin, function(err){
        if (err){
            console.log("Login Error:", err)
            res.redirect("/login")
        } else {
            passport.authenticate("local")(req, res, function(){
                console.log("Authenticated successfully!")
                res.redirect("/admin/dashboard")
            })
        }
    })
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
            res.render("status", { message: "Successfully updated" })
        })
        .catch((err)=>{
            console.log(err)
            res.render("status", { message: "Error updating product" })
        })
    } else {
        res.redirect("/login")
    }
})

app.post("/admin/upload", upload.single('productImage'), function(req, res) {
    const product = new Product({
        name: req.body.name,
        description: req.body.description,
        image: '/images/' + req.file.filename, // Store the image path
        price: req.body.price,
        stock: req.body.stock
    })

    product.save()
        .then(() => res.render("status", { message: "Product added successfully" }))
        .catch(err => {
            console.log(err)
            res.render("status", { message: "Error adding product" })
        })
})

app.get("/admin/delete/:productId", function(req, res){
    if (req.isAuthenticated()){
        Product.findById(req.params.productId)
            .then((foundProduct) => {
                if (foundProduct) {
                    // Delete the image file from the public/images directory
                    const imagePath = path.join(__dirname, 'public', foundProduct.image)
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.log(err)
                            res.render("status", { message: "Error deleting product image" })
                            return
                        }

                        // Delete the product from the database
                        Product.findByIdAndDelete(req.params.productId)
                            .then(() => {
                                res.render("status", { message: "Successfully deleted" })
                            })
                            .catch((err) => {
                                console.log(err)
                                res.render("status", { message: "Error deleting product" })
                            })
                    })
                } else {
                    res.render("status", { message: "Product not found" })
                }
            })
            .catch((err) => {
                console.log(err)
                res.render("status", { message: "Error finding product" })
            })
    } else {
        res.redirect("/login")
    }
})

app.post("/remove-from-cart/:productId", function(req, res) {
    const productId = req.params.productId;

    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.productId !== productId);
    }

    res.redirect("/cart");
});

app.post("/add-to-cart/:productId", function (req, res) {
    const productId = req.params.productId
    const quantity = Number(req.body.quantity)

    // Retrieve product details from database
    Product.findById(productId)
        .then(product => {
            if (!product) {
                res.render("status", { message: "Product not found" })
                return
            }

            // Initialize session cart if it doesn't exist
            req.session.cart = req.session.cart || []

            // Check if product is already in cart, update quantity if so
            let found = false;
            req.session.cart.forEach(item => {
                if (item.productId === productId) {
                    item.quantity += quantity
                    found = true
                }
            })

            // If product not in cart, add new item
            if (!found) {
                req.session.cart.push({
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    quantity: quantity,
                    image: product.image // Ensure this field matches your product schema
                })
            }

            res.redirect("/products") // Redirect to products page or wherever needed
        })
        .catch(err => {
            console.log(err)
            res.render("status", { message: "Error adding to cart" })
        });
});

// Route to render checkout page
app.get("/checkout", function (req, res) {
    res.render("checkout", { cart: req.session.cart })
})

// Route to process checkout
app.post("/process-checkout", function (req, res) {
    const cart = req.session.cart;
    const { firstName, lastName, contact, email, address1, address2, city, state, country, zip } = req.body;

    if (!cart || cart.length === 0) {
        res.render("status", { message: "Your cart is empty. Please add items to the cart before checking out." });
        return;
    }

    const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const order = new Order({
        firstName,
        lastName,
        contact,
        email,
        address1,
        address2,
        city,
        state,
        country,
        zip,
        items: cart,
        totalPrice
    });

    order.save()
        .then(() => {
            // Clear the cart
            req.session.cart = [];

            // Render a success page
            res.render("status", { message: "Order placed successfully!" });
        })
        .catch(err => {
            console.error(err);
            res.render("status", { message: "There was an error processing your order. Please try again." });
        });
});

app.post("/admin/orders/:orderId/fulfill", function (req, res) {
    const orderId = req.params.orderId;

    Order.deleteOne({ _id: orderId })
        .then(() => {
            res.redirect("/admin/orders");
        })
        .catch(err => {
            console.error(err);
            res.render("status", { message: "Error fulfilling order." })
        })
})



//Spinning the app with a port
app.listen(3000, function(){
    console.log("Server started on port 3000")
})
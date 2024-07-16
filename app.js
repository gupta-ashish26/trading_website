//Importing dependencies:

const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const _ = require("lodash")
const mongoose = require("mongoose");

//Setting up the modules to use them

const app = express()
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"))

mongoose.connect("mongodb://localhost:27017/tradeDB")

//Defining Schemas:
const adminSchema = new mongoose.Schema({
    email: String,
    password: String,
})

const Admin = mongoose.model("Admin", adminSchema)

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








//Spinning the app with a port
app.listen(3000, function(){
    console.log("Server started on port 3000");
});
//Importing dependencies:

const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const _ = require("lodash")

//Setting up the modules to use them

const app = express()
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"))


const products = [
    { name: "Product 1", description: "Description for Product 1", price: 100, image: "/images/pencil.jpg" },
    { name: "Product 2", description: "Description for Product 2", price: 150, image: "/images/books.jpg" },
    { name: "Product 3", description: "Description for Product 3", price: 200, image: "/images/colorpencil.jpg" },
    { name: "Product 4", description: "Description for Product 4", price: 250, image: "/images/waterbottle.jpg" },
    { name: "Product 5", description: "Description for Product 5", price: 300, image: "/images/highlighter.jpg" },
    { name: "Product 6", description: "Description for Product 6", price: 350, image: "/images/calc.jpg" },
    { name: "Product 7", description: "Description for Product 7", price: 400, image: "/images/bag.jpg" },
    { name: "Product 8", description: "Description for Product 8", price: 450, image: "/images/pins.jpg" }
];


//Routing and rendering:

app.get("/", function(req, res){
    res.render("home")
})


app.get("/products", function(req, res) {

    res.render("products", { products: products });
});

app.get("/products/:productName", function(req, res){
    const requestedProduct = _.lowerCase(req.params.productName)

    products.forEach(function(product){
        storedProduct = _.lowerCase(product.name)
        if (storedProduct === requestedProduct){
            res.render("product",{product: product})
          }
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
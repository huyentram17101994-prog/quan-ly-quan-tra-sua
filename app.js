const express = require("express");
const session = require("express-session");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "123",
    resave: false,
    saveUninitialized: true
}));

app.use("/", require("./routes/auth.routes"));
app.use("/products", require("./routes/product.routes"));
app.use("/orders", require("./routes/order.routes"));

app.listen(3000, () => {
    console.log("http://localhost:3000");
});
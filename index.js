require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const { log } = require("console");
const sid = process.env.SID;
const auth_token = process.env.AUTH_TOKEN;
const twilio = require('twilio')(sid, auth_token);
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cache = require('memory-cache');
const app = express();
const port = process.env.PORT || 3000;

// app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// const upload = multer({ dest: 'uploads/' })
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  }
})
const upload = multer({ storage });


app.set("view engine", 'ejs');
app.set("views", path.resolve("./views"));

app.use(session({
  secret: 'OUR LITTLE SECRET',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  cartItems: [],
  username: String
})

const productSchema = mongoose.Schema({
  image: String,
  name: String,
  priceRange: String,
  currentPrice: String,
  _id: String
})

const adminSchema = mongoose.Schema({
  email: String,
  username: String,
  password: String
})
const counterSchema = mongoose.Schema({
  count: Number
})

const detailSchema = mongoose.Schema({
  _id: String,
  name: String,
  address: String,
  email: String,
  mobile: Number
})
const orderSchema = mongoose.Schema({
  order: [],
  name: String
})
// userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"]});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Counter = mongoose.model("Counter", counterSchema);
const Detail = mongoose.model("Detail", detailSchema);
const Order = mongoose.model("Order", orderSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      password: user.password
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

async function generateUniqueUsername(originalUsername) {
  let username = originalUsername;
  let counter = 1;

  while (await User.findOne({ username: username })) {
    username = originalUsername + counter;
    counter++;
  }

  return username;
}
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "/auth/google/secrets"
},
  async function (accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    const username = profile.displayName;
    const uniqueUsername = await generateUniqueUsername(username);
    const googleId = profile.id;
    User.findOrCreate({ googleId: googleId }, { googleId: googleId, username: uniqueUsername }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/", function (req, res) {
  const message = req.query.message || '';
  res.render("index", { message });
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login", function (req, res) {
  res.render("login");
})
app.get("/register", function (req, res) {
  res.render("register", { errormessage: "" });
})


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

app.get("/secrets", ensureAuthenticated, function (req, res) {
  res.render("secrets", { userinside: req.user.username });
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  })


})
app.post("/register", (req, res) => {


  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.render("register", { errormessage: "username already exists" });
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      })
    }
  })

})

app.post("/login", function (req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  })

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      })
    }
  })

})

app.get("/product", async function (req, res) {
  try {
    const allItems = await Product.find({});
    res.render("products", { allItems: allItems });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
})

app.get("/adminControlRouteToProceed", function (req, res) {
  res.render("admin_login", { errorMessage: "" });
})

app.post("/admin_login", async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const foundAdmin = await Admin.find({ username: username, password: password });

    if (foundAdmin.length > 0) {
      const orderData = await Order.findById('64d267d717a3f66df58ef8bf');
      res.render("admin", { first_array: orderData.order });
    } else {
      res.render("admin_login", { errorMessage: "Invalid username or password" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
})


app.get("/addtocartbtn", ensureAuthenticated, async function (req, res) {
  let productId = req.query.productId;
  productId = "product-" + productId;
  const doc = await Product.findById({ _id: productId });
  const newItem = {
    image: doc.image,
    name: doc.name,
    currentPrice: doc.currentPrice,
    _id: doc._id,
    quantity: 1
  };
  const userId = req.user.id;
  const userTobefound = await User.findById(userId);
  const arrayCart = userTobefound.cartItems;
  const _itemId = doc._id;
  const itemExist = await arrayCart.some((item) => item._id === _itemId);

  if (itemExist) {
    console.log("already exist");
  } else {
    await User.findByIdAndUpdate(userId, { $push: { cartItems: newItem } }, { new: true });
  }

})

app.post("/admin", upload.single("image"), async function (req, res) {
  try {
    const filePathFromReq = req.file.path;
    const image = path.join(...filePathFromReq.split(path.sep)).replace("\\", "/");
    const name = req.body.name;
    const priceRange = req.body.priceRange;
    const currentPrice = req.body.currentPrice;

    const foundDocument = await Counter.findOne({ _id: "64caa6a1a12e09107359e4bc" });
    let count = 1;
    let _id = "product-" + count;
    if (foundDocument) {
      _id = "product-" + foundDocument.count;
      count = foundDocument.count + 1;
    }

    await Counter.findOneAndUpdate({ _id: "64caa6a1a12e09107359e4bc" }, { $set: { count: count } });
    await Product.insertMany([{ image: image, name: name, priceRange: priceRange, currentPrice: currentPrice, _id: _id }]);

    res.status(200).send("Product added successfully.");
  } catch (error) {
    console.error("Error while adding product:", error);
    res.status(500).send("Internal Server Error");
  }
})

function ensureAuthenticate(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // User is authenticated
  }
  res.redirect('/?message=login_required');
}

app.get("/cart", ensureAuthenticate, async function (req, res) {
  const userId = req.user.id;
  const foundDoc = await User.findById({ _id: userId });
  let usercart;
  if (foundDoc) {
    usercart = foundDoc.cartItems;
  }

  if (usercart && usercart.length > 0) {
    res.render("cart", { cartProd: usercart });
  } else {
    res.render("cart_emp");
  }
})

app.post("/deleteCartItem", async function (req, res) {
  const ItemidObtained = req.body.itemId;
  const UserId = req.user.id;
  try {
    await User.findByIdAndUpdate(UserId, { $pull: { cartItems: { _id: ItemidObtained } } });
    res.redirect("/cart");
  } catch (err) {
    res.status(500).send("An error occurred while removing the item from cart.");
  }
})
app.post("/updateCartItemQuantity", async function (req, res) {
  const { itemId, quantity } = req.body;
  const userID = req.user.id;
  try {
    const updateQuery = {
      $set: { 'cartItems.$[elem].quantity': quantity }
    };

    const options = {
      arrayFilters: [{ 'elem._id': itemId }]
    };

    const userforCart = await User.findByIdAndUpdate(userID, updateQuery, options, { new: true });

    if (userforCart) {
      console.log('Cart item quantity updated successfully:');
    } else {
      res.status(404).json({ error: 'User not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while updating cart item quantity.' });
  }

})
app.get("/DETAILOFUSER", async function (req, res) {
  try {
    const COST = req.query.param1;
    // res.render("detailsneeded",{pricetopay:COST});
    const USERID = req.user.id;

    const userDetail = await Detail.findById(USERID);
    const foundUser = await User.findById(USERID);
    await cache.put(`${req.user.id}_cartItems`, foundUser.cartItems, 480000);
    if (!userDetail) {
      res.render("detailsneeded", {
        pricetopay: COST,
        field: ""
      });
    } else {
      res.render("payment", { pricetopay: COST });
    }
  } catch (err) {
    console.error("Error in /DETAILOFUSER:", err);
    res.status(500).send("Internal Server Error");
  }

})




app.post("/sendOTPByEmail", async (req, res) => {

  const email = req.body.email;

  // Generate a random 6-digit OTP
  const email_otp = Math.floor(100000 + Math.random() * 900000);
  const mailOptions = {
    from: 'grocomarketing@gmail.com',
    to: email,
    subject: "OTP Verification",
    text: `Your OTP for email verification is: ${email_otp}`,
  };

  // Save the OTP and email to a database or session (for verification later)
  try {
    cache.put(`${req.user.id}_email_Otp`, email_otp, 300000);
    const transporter = nodemailer.createTransport({
      service: 'gmail',// e.g., Gmail, Outlook,etc
      auth: {
        user: 'grocomarketing@gmail.com',
        pass: process.env.PASS,
      },
    });

    // Send OTP via email
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP sent successfully:", info.response);
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).send("Failed to send OTP.");
  }
});

app.post("/sendOTPByPhone", function (req, res) {
  let { mobile } = req.body;
  mobile = "+91" + mobile;
  const mobile_otp = Math.floor(100000 + Math.random() * 900000);

  cache.put(`${req.user.id}_mobile_Otp`, mobile_otp, 300000);
  twilio.messages.create({
    from: '+16184924052',
    to: mobile,
    body: `Your OTP for mobile number verification is: ${mobile_otp}`
  }).then((res) => {
    console.log("sms sent successfully");
  }).catch((err) => {
    console.log(err);
  })
})

const YOUR_DOMAIN = 'http://127.0.0.1:3000';
app.post('/create-checkout-session', async (req, res) => {
  const mobileOtp = req.body.otpphone;
  const emailOtp = req.body.otpemail;

  const price = req.body.price;
  const email_otp = cache.get(`${req.user.id}_email_Otp`);
  const mobile_otp = cache.get(`${req.user.id}_mobile_Otp`);
  if (emailOtp == email_otp && mobileOtp == mobile_otp) {
    Detail.insertMany({
      _id: req.user.id,
      name: req.body.person,
      address: req.body.address,
      email: req.body.email,
      mobile: req.body.mobileno
    })
    const amountToCharge = parseInt(price * 100);
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price_data: {
            unit_amount: amountToCharge,
            currency: 'usd',
            product: 'prod_OPbo1KcWE1J4aZ'
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/css/success.html?userId=${req.user.id}`,
      cancel_url: `${YOUR_DOMAIN}/css/cancel.html`,

    });

    res.redirect(303, session.url);
  } else {
    res.render("detailsneeded", { field: "Incorrect Otp", pricetopay: price });
  }
}
);

app.post("/payment", async function (req, res) {
  try {
    const price = req.body.price;
    const amountToCharge = parseInt(price * 100);

    const foundUser = await User.findById(req.user.id);
    await cache.put(`${req.user.id}_cartItems`, foundUser.cartItems, 480000);
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price_data: {
            unit_amount: amountToCharge,
            currency: 'usd',
            product: 'prod_OPbo1KcWE1J4aZ'
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/css/success.html?userId=${req.user.id}`,
      cancel_url: `${YOUR_DOMAIN}/css/cancel.html`,

    });

    res.redirect(303, session.url);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }

})


app.post("/success-payment", async function (req, res) {
  const { userId } = req.body;
  const foundUserdetail = await Detail.findById(userId);
  const _id = userId;
  const name = foundUserdetail.name;
  const address = foundUserdetail.address;
  const mobile = foundUserdetail.mobile;

  const cartProducts = cache.get(`${userId}_cartItems`);

  const orderData = cartProducts.map(orderItem => ({
    name: orderItem.name,
    image: orderItem.image,
    quantity: orderItem.quantity
  }));

  const orderObject = {
    _id: _id,
    name: name,
    address: address,
    mobile: mobile,
    order: orderData
  };
  await Order.findByIdAndUpdate('64d267d717a3f66df58ef8bf', { $push: { order: orderObject } }, { new: true, upsert: true });

  await User.findByIdAndUpdate(userId, { $set: { cartItems: [] } }, { new: true });



})

app.post("/deleteDoneOrder", async function (req, res) {
  const idToDelete = req.body.idtodeleteorder;
  try {

    await Order.updateOne(
      { 'order._id': idToDelete },
      { $pull: { order: { _id: idToDelete } } },
      { new: true }
    );

    const doc = await Order.findById('64d267d717a3f66df58ef8bf');
    const first_array = doc.order;

    res.render("admin", { first_array: first_array });
  } catch (error) {
    // Handle errors
    console.error("Error removing user:", error);
    res.status(500).send("Internal Server Error");
  }

})

app.listen(port, () => {
  console.log(`app is running on port ${port}`)
})



// for admin login url:
// localhost:3000/adminControlRouteToProceed
// credentials:
// username: Abhiraj
// password: Nemesis#Prime
if (process.env.NODE_ENV !== "production") {
	require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");

const userRoutes = require("./routes/user");
const detailsRoutes = require("./routes/details");
const error = require("./middlewares/error");
const { refreshData, refreshUpContests } = require("./RefreshData");
const passportSetup = require("./passport");
const passport = require("passport");

const dbUrl = process.env.ATLAS_URL;
mongoose
	.connect(dbUrl)
	.then(() => {
		console.log("mongo database connected");
	})
	.catch((err) => {
		console.log("mongo connection error!!");
		console.log(err);
	});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }));
app.use(passport.initialize());

app.use("/api/v1", userRoutes);
app.use("/api/v1/details", detailsRoutes);

app.use(error);

// refreshData();
// refreshUpContests(); //this timer will be greater than refreshData

const port = process.env.PORT;
app.listen(port, () => {
	console.log(`listening on port ${port}`);
});

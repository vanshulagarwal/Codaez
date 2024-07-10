const {
    getLeetcodeData,
    getCodeforcesData,
    getCodechefData,
} = require("../RefreshData/index.js");
const { cloudinary } = require("../cloudinary/index.js");
const FRequest = require("../models/frequests.js");
const User = require("../models/user.js");
const ApiFeatures = require("../utils/apiFeatures.js");
const calcAggregateRating = require("../utils/calcAggregateRating.js");
const ErrorHand = require("../utils/errorHand.js");
const sendjwtToken = require("../utils/sendjwtToken");
const bcrypt = require("bcrypt");



/////////////////// Auth ////////////////////////

module.exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!(username || email || password)) {
        return next(new ErrorHand("All fields are  required", 400));
    }

    const foundUser = await User.findOne({ email });

    if (foundUser) {
        return res.status(200).json({
            success: true,
            error: "Email already in use",
        });
    }

    const availableUser = await User.findOne({ username });
    if (availableUser) {
        return res.status(200).json({
            success: true,
            error: "username already taken",
        });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = new User({
        username,
        email,
        password: hash,
    });
    await user.save();

    sendjwtToken(user, 201, res);
};

module.exports.completeProfile = async (req, res) => {
    const {
        name,
        college = "",
        lc,
        cf,
        cc,
        linkedin = "",
        github = "",
        twitter = "",
        hashnode = "",
        medium = "",
    } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { name, college, linkedin, github, twitter, hashnode, medium },
        { new: true }
    );

    if (req.file) {
        user.avatar = {
            url: req.file?.path || "",
            filename: req.file?.filename || "",
        };
    }

    if (lc && lc.length > 0) {
        user.lc.username = lc;
        user.lc = await getLeetcodeData(lc);
    }
    if (cf && cf.length > 0) {
        user.cf.username = cf;
        user.cf = await getCodeforcesData(cf);
    }
    if (cc && cc.length > 0) {
        user.cc.username = cc;
        user.cc = await getCodechefData(cc);
    }
    user.aggregateRating = calcAggregateRating(user);
    await user.save();

    res.status(200).json({
        status: "success",
        user,
        message: "profile completed",
    });
};

module.exports.login = async (req, res, next) => {
    const { username, email, password } = req.body;

    if (!(username || email)) {
        return next(new ErrorHand("Email or Username is required", 400));
    }

    const user = await User.findAndValidate(email, username, password);

    if (!user) {
        return next(new ErrorHand("Invalid email or password", 404));
    }
    sendjwtToken(user, 200, res);
};

module.exports.logout = async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.status(200).json({
        status: true,
        message: "Logged Out",
    });
};

module.exports.changePassword = async (req, res, next) => {
    const { oldpw, newpw } = req.body;
    //current logged in userdetails
    // console.log(req.user);

    const result = await bcrypt.compare(oldpw, req.user?.password);
    if (!result) {
        return next(new ErrorHand("Password incorrect", 401));
    } else {
        const hash = await bcrypt.hash(newpw, 12);
        await User.findOneAndUpdate(
            { username: req.user?.username },
            { password: hash }
        );
        res.status(200).json({
            success: true,
            message: "Password successfully changed",
        });
    }
};
//   module.exports.forgotPassword =catchAsync( async (req, res) => {
//     const { oldpw,newpw } = req.body;
//     //current logged in userdetails
//     const user = await User.findOne({  username });
//     const result = await bcrypt.compare(oldpw , user.password);
//     if(!result){
//         //oldpw  doesn't match
//     }else{
//         const hash = await bcrypt.hash(newpw, 12);
//         await User.findOneAndUpdate({password:hash});
//     }

//   });

module.exports.setUsername = async (req, res, next) => {
    const { lc, cc, cf } = req.body;
    if (
        (lc && lc.username?.trim().length === 0) ||
        (cc && cc.username?.trim().length === 0) ||
        (cf && cf.username?.trim().length === 0)
    ) {
        return next(new ErrorHand("username is required"));
    }

    req.user.lc = await getLeetcodeData(lc?.username);
    req.user.cf = await getCodeforcesData(cf?.username);
    req.user.cc = await getCodechefData(cc?.username);

    req.user.aggregateRating = calcAggregateRating(req.user);

    await req.user.save();

    res.status(200).json({
        status: true,
        message: "Username updated",
        user: req.user,
    });
};


///////////////////////  Search  ////////////////////////////

module.exports.userDetails = async (req, res, next) => {
    const apiFeatures = new ApiFeatures(User.find(), req.query).search();
    const users = await apiFeatures.query;
    res.status(201).json({
        status: true,
        users,
    });
};


///////////////////// Follow ////////////////////////////////

module.exports.sendFollowRequest = async (req, res, next) => {
    const { userId } = req.body;
    const user = await User.findById(userId).populate('fRequests', 'senderusername');//reciever



    if (!user) {
        return next(new ErrorHand("user not found", 404));
    }

    if (user.username === req.user.username) {
        return next(new ErrorHand("can't send follow request to yourself", 401));
    }

    const pendingrequest = user.fRequests.some(fr => fr.senderusername === req.user?.username);
    if (pendingrequest) {
        return next(new ErrorHand("already sent Follow request", 400));
    }
    if (user.follower.some((el) => el.toString() === req.user._id.toString())) {
        return next(new ErrorHand("already a follower", 400));
    }

    const fRequest = new FRequest({
        senderusername: req.user.username,
        sendername: req.user.name,
        senderavatar: req.user.avatar || { url: "", filename: "" },
        recieverusername: user.username,
    });
    user.fRequests.push(fRequest);
    await fRequest.save();
    await user.save();

    res.status(200).json({
        success: true,
        fRequest,
    });
};

module.exports.withdrawRequest = async (req, res, next) => {
    const { userId, username } = req.body;

    const frequest = await FRequest.findOneAndDelete({ senderusername: req.user?.username, recieverusername: username });
    await User.findByIdAndUpdate(userId, { $pull: { fRequests: frequest?._id } });


    res.status(200).json({
        success: true,
        msg: "Request removed"
    })

}

module.exports.acceptFollowRequest = async (req, res, next) => {
    const { reqId } = req.body;

    const frequest = await FRequest.findById(reqId);

    if (!frequest) {
        return next(new ErrorHand("invalid request", 400))
    }

    if (req.user.username !== frequest?.recieverusername) {
        return next(new ErrorHand("You have not authorized to do this", 401));
    }

    const user = await User.findOne({ username: frequest?.senderusername }); //sender or follower
    user.following.push(req.user);
    req.user.follower.push(user);
    await user.save();
    // await req.user.save();

    req.user.fRequests = req.user?.fRequests.filter((el) => el.toString() !== reqId.toString());
    await req.user.save();


    await FRequest.findByIdAndDelete(reqId);

    res.status(200).json({
        status: true,
        msg: `${frequest.senderusername} was added as a follower`,
        curr_user: req.user
    });
};

module.exports.rejectFollowRequest = async (req, res, next) => {
    const { reqId } = req.body;

    const frequest = await FRequest.findById(reqId);
    if (req.user.username !== frequest?.recieverusername) {
        return next(new ErrorHand("You have not authorized to do this", 401));
    }

    // const curr_user = await User.findByIdAndUpdate(req.user._id, { $pull: { fRequests: reqId } }, { new: true });

    req.user.fRequests = req.user?.fRequests.filter(fr => fr.toString() !== reqId.toString());
    await req.user.save();

    await FRequest.findByIdAndDelete(reqId);

    res.status(200).json({
        status: true,
        msg: `Request rejected`,
        curr_user: req.user
    });
};

module.exports.unFollow = async (req, res) => {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(userId, { $pull: { follower: req.user?._id } }, { new: true });

    const curr_user = await User.findByIdAndUpdate(
        req.user?._id,
        { $pull: { following: user?._id } },
        { new: true }
    );

    res.status(200).json({
        success: true,
        msg: `you unfollow ${user.username}`,
        curr_user
    })



}

module.exports.getReqeusts = async (req, res, next) => {
    await req.user.populate('fRequests');

    res.status(200).json({
        status: true,
        frequests: req.user.fRequests
    })

}


////////////////////// Profile   //////////////////////

module.exports.profile = async (req, res, next) => {
    const { username } = req.params;

    const user = await User.findOne({ username: username }).select("-passsword").populate('fRequests', 'senderusername');

    if (!user) {
        return res.status(404).json({
            status: false,
            msg: "user not found"
        })
    }

    const isrequested = user?.fRequests?.some((fr) => fr.senderusername === req.user?.username);
    const isfollowing = user?.follower.some((el) => el.toString() === req.user._id.toString());

    res.status(200).json({
        status: true,
        user,
        isrequested,
        isfollowing
    })
};


module.exports.updateProfile = async (req, res, next) => {
    const {
        name,
        // username,
        college,
        // email,
        lc,
        cf,
        cc,
        linkedin,
        github,
        twitter,
        hashnode,
        medium,
    } = req.body;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            name,
            //   username,
            college,
            //   email,
            linkedin,
            github,
            twitter,
            hashnode,
            medium,
        },
        { new: true }
    );
    if (lc.length > 0) {
        user.lc.username = lc
    }
    if (cf.length > 0) {
        user.cf.username = cf
    }
    if (cc.length > 0) {
        user.cc.username = cc
    }

    user.lc = await getLeetcodeData(user?.lc?.username);
    user.cf = await getCodeforcesData(user?.cf?.username);
    user.cc = await getCodechefData(user?.cc?.username);

    user.aggregateRating = calcAggregateRating(user);

    await user.save();

    res.status(200).json({
        success: true,
        message: "user profile updated",
        user,
    });
};

module.exports.editAvatar = async (req, res, next) => {
    if (req.user?.avatar?.filename)
        await cloudinary.uploader.destroy(req.user?.avatar.filename);

    if (req.file) {
        req.user.avatar = {
            url: req.file.path,
            filename: req.file.filename,
        };
        await req.user.save();
    }
    res.status(200).json({
        success: true,
        message: "user avatar updated",
        user: req.user,
    });
};


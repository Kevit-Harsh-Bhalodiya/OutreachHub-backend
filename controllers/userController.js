const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel.js");
const WorkspaceUserModel = require("../models/WorkspaceUserModel.js");

exports.user_login = (req, res, next) => {
  UserModel.findOne({
    "contactInfo.email": req.body.email,
  })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed",
        });
      } else {
        bcrypt.compare(req.body.password, user.password, (err, result) => {
          if (err) {
            return res.status(401).json({
              message: "Auth failed",
            });
          }
          if (result) {
            const token = jwt.sign(
              {
                email: user.contactInfo.email,
                userId: user._id,
              },
              process.env.JWT_KEY,
              {
                expiresIn: "1h",
              },
            );
            return res.status(200).json({
              message: "Auth successful",
              token: token,
            });
          }
          res.status(401).json({
            message: "Auth failed",
          });
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
};
exports.getAllWorkspaceByUserId = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.userData.userId, {
      workspaces: 1,
    }).populate("workspaces");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.status(200).json({
      message: "Workspaces fetched successfully",
      workspaces: user.workspaces,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error fetching workspaces",
      error: err,
    });
  }
};
exports.setCurrentWorkspace = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.userData.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!req.body.workspaceId) {
      return res.status(400).json({
        message: "Workspace ID is required",
      });
    } else {
      if (user.workspaces.includes(req.body.workspaceId)) {
        const token = jwt.sign(
          {
            email: user.contactInfo.email,
            userId: user._id,
            workspaceId: req.body.workspaceId,
          },
          process.env.JWT_KEY,
          {
            expiresIn: "1h",
          },
        );
        return res.status(200).json({
          message: "Current workspace set successfully",
          token: token,
        });
      } else {
        return res.status(400).json({
          message: "Workspace not found in user's workspaces",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error setting current workspace",
      error: err,
    });
  }
};
exports.user_signup = (req, res, next) => {
  UserModel.findOne({ "contactInfo.email": req.body.contactInfo.email }).then(
    (user) => {
      if (user) {
        return res.status(409).json({
          message: "Email already exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
            });
          } else {
            const newUser = {
              _id: new mongoose.Types.ObjectId(),
              name: req.body.name,
              password: hash,
              contactInfo: {
                email: req.body.contactInfo.email,
                phoneNo: req.body.contactInfo.phoneNo,
                countryCode: req.body.contactInfo.countryCode,
              },
              workspaces: [],
              joinDate: new Date(),
            };
            UserModel.create(newUser)
              .then((result) => {
                console.log(result);
                res.status(201).json({
                  message: "user created",
                });
              })
              .catch((err) => {
                console.log(err);
                res.status(500).json({
                  error: err,
                });
              });
          }
        });
      }
    },
  );
};
exports.user_delete = async (req, res, next) => {
  const userId = req.params.userId;
  const password = req.body.password;
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    bcrypt.compare(password, user.password, async (err, result) => {
      if (err || !result) {
        return res.status(401).json({
          message: "Auth failed",
        });
      }

      await UserModel.deleteOne({ _id: userId });
      await WorkspaceUserModel.deleteMany({ userId });
      return res.status(200).json({
        message: "User deleted successfully",
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};
exports.get_user_by_id = (req, res, next) => {
  UserModel.findById(req.userData.userId, { password: 0 })
    .then((user) => {
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }
      res.status(200).json(user);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
};

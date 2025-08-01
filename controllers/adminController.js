const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminModel = require("../models/AdminModel.js");

// Admin login
exports.admin_login = (req, res, next) => {
  AdminModel.findOne({
    "contactInfo.email": req.body.email,
  }).then((admin) => {
    if (!admin) {
      return res.status(401).json({
        message: "Auth failed",
      });
    } else {
      bcrypt.compare(req.body.password, admin.password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Auth failed",
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              email: req.body.email,
              adminId: admin._id,
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
  });
};
exports.admin_signup = (req, res, next) => {
  AdminModel.findOne({ "contactInfo.email": req.body.contactInfo.email }).then(
    (admin) => {
      if (admin) {
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
            const newAdmin = {
              _id: new mongoose.Types.ObjectId(),
              name: req.body.name,
              password: hash,
              contactInfo: {
                email: req.body.contactInfo.email,
                phoneNo: req.body.contactInfo.phoneNo,
                countryCode: req.body.contactInfo.countryCode,
              },
              joinDate: new Date(),
            };
            AdminModel.create(newAdmin)
              .then((result) => {
                console.log(result);
                res.status(201).json({
                  message: "Admin created",
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

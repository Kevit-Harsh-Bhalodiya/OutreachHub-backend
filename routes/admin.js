const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController.js");
const auth = require("../middlewares/auth.js");

router.post("/login", AdminController.admin_login);
router.post("/createAdmin", auth, AdminController.admin_signup);
// router.post("/signup", auth, AdminController.admin_signup);
// router.delete("/:userId", auth, AdminController.user_delete);
// router.get("/", auth, AdminController.get_user_by_id);
module.exports = router;

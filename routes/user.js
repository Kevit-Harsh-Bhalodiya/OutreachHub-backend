const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController.js");
const auth = require("../middlewares/auth.js");

router.post("/login", UserController.user_login);
router.post("/signup", UserController.user_signup);
router.delete("/:userId", auth, UserController.user_delete);
router.get("/", auth, UserController.get_user_by_id);
router.get("/all", auth, UserController.getAllWorkspaceByUserId);
router.post("/setWorkspace", auth, UserController.setCurrentWorkspace);
module.exports = router;

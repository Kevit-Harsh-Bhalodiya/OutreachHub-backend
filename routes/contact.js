const express = require("express");
const router = express.Router();
const ContactController = require("../controllers/contactController.js");
const auth = require("../middlewares/auth.js");


// get all contacts
router.get("/", auth, ContactController.getAllContactsByWorkspace);
// get all contacts of user
router.get("/user", auth, ContactController.getAllContactsByUser);
// add new contact
router.post("/", auth, ContactController.addContactByUser);
// remove contact
router.delete("/:contactId", auth, ContactController.deleteContactByUser);
// edit contact
router.patch("/:contactId", auth, ContactController.editContact);
// filter contact by tags
router.post("/filter", auth, ContactController.filterContactsByTags);
module.exports = router;

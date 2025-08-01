const express = require("express");
const router = express.Router();
const MessageTemplateController = require("../controllers/messageTemplateController.js");
const auth = require("../middlewares/auth.js");


// create new message template (userId)
router.post("/", auth, MessageTemplateController.createMessageTemplate);
// edit message template (userId)
router.patch(
  "/:messageTemplateId",
  auth,
  MessageTemplateController.editMessageTemplate,
);
// delete message template (userId)
router.delete(
  "/:messageTemplateId",
  auth,
  MessageTemplateController.deleteMessageTemplate,
);
// get message template by templateid
router.get(
  "/:messageTemplateId",
  auth,
  MessageTemplateController.getMessageTemplateById,
);
// get all message templates by workspaceId
router.get("/", auth, MessageTemplateController.getAllMessageTemplates);
module.exports = router;

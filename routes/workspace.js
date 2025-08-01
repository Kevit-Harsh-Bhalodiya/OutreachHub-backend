const express = require("express");
const router = express.Router();
const WorkspaceController = require("../controllers/workspaceController.js");
const auth = require("../middlewares/auth.js");

router.get("/admin", auth, WorkspaceController.getAllWorkspaces);
router.get("/user", auth, WorkspaceController.getAllWorkspacesByUserId);
router.post("/create", auth, WorkspaceController.createWorkspace);
router.post("/addMember", auth, WorkspaceController.addMemberToWorkspace);
router.delete(
  "/deleteMember",
  auth,
  WorkspaceController.deleteMemberFromWorkspace,
);
router.delete("/delete", auth, WorkspaceController.deleteWorkspace);
router.get("/", auth, WorkspaceController.getWorkspaceById);
router.post("/addTags", auth, WorkspaceController.addTagToWorkspace);
routes.patch(
  "/updateWorkspace",
  auth,
  WorkspaceController.updateWorkspace,
);
router.delete("/removeTags", auth, WorkspaceController.removeTagFromWorkspace);

module.exports = router;

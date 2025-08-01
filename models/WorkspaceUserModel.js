const mongoose = require("mongoose");
const WorkspaceUserSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  permissions: {
    write: { type: Boolean, default: false },
    allowAdd: { type: Boolean, default: false },
  },
  joinDate: { type: Date, default: Date.now },
});
module.exports = mongoose.model("WorkspaceUser", WorkspaceUserSchema);

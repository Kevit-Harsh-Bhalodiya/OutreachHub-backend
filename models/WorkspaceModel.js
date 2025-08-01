const mongoose = require("mongoose");
const WorkspaceSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  tags: { type: [String], default: [] },
  creationDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Workspace", WorkspaceSchema);

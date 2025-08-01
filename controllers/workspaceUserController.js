const mongoose = require("mongoose");
const WorkspaceUserModel = require("../models/WorkspaceUserModel.js");
const UserModel = require("../models/UserModel.js");
const removeWorkspaceUser = async (userId, workspaceId) => {
  const workspace = await WorkspaceUserModel.deleteOne({
    userId: userId,
    workspaceId: workspaceId,
  });
  const user = await UserModel.updateOne(
    { _id: userId },
    { $pull: { workspaces: workspaceId } },
  );
  return user && workspace;
};

module.exports = {
  removeWorkspaceUser,
};

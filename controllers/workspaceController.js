const mongoose = require("mongoose");
const WorkspaceModel = require("../models/WorkspaceModel.js");
const UserModel = require("../models/UserModel.js");
const WorkspaceUserModel = require("../models/WorkspaceUserModel.js");
const AdminModel = require("../models/AdminModel.js");
const WorkspaceUserController = require("./workspaceUserController.js");
const checkAdminExists = async (req, res) => {
  const admin = await AdminModel.findById(req.userData.adminId, { _id: 1 });
  if (!admin) {
    return res.status(404).json({
      message: "Admin not found",
    });
  }
};
const checkWorkspaceByName = async (req, res) => {
  const workspace = await WorkspaceModel.findOne(
    { name: req.body.name },
    { _id: 1 },
  );
  if (workspace) {
    return res.status(400).json({
      message: "Workspace with this name already exists",
    });
  }
};
const checkWorkspaceById = async (workspaceId) => {
  const workspace = await WorkspaceModel.findById(workspaceId, {
    _id: 1,
  });
  return workspace ? true : false;
};
const checkUserExists = async (req, res, userId, name) => {
  const user = await UserModel.findById(userId, { _id: 1 });
  if (!user) {
    return res.status(404).json({
      message: `${name} not found`,
    });
  }
  return false;
};
const checkMemberExistsInWorkspace = async (userId, workspaceId) => {
  const workspaceUser = await WorkspaceUserModel.findOne(
    {
      workspaceId: workspaceId,
      userId: userId,
    },
    { _id: 1 },
  );
  return workspaceUser ? true : false;
};
const checkUserAddPermission = async (req, res, userId, workspaceId) => {
  const user = await WorkspaceUserModel.findOne({
    userId: userId,
    workspaceId: workspaceId,
    "permissions.allowAdd": true,
  });
  if (!user) {
    return res.status(403).json({
      message:
        "You do not have permission to add/delete members to this workspace",
    });
  }
};
exports.getAllWorkspaces = async (req, res, next) => {
  try {
    await checkAdminExists(req, res);
    const workspace = await WorkspaceModel.find();
    res.status(200).json({
      message: "All workspaces fetched successfully",
      workspaces: workspace,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching workspaces",
      error: error,
    });
  }
};

exports.getAllWorkspacesByUserId = async (req, res, next) => {
  const userId = req.userData.userId;
  try {
    let response = await checkUserExists(req, res, userId, "User");
    if (response) {
      return response; // If user does not exist, return early
    } else {
      const workspaces = await WorkspaceUserModel.find(
        { user_id: userId },
        { workspaceId: 1 },
      ).populate("workspaceId");
      res.status(200).json({
        message: "All workspaces fetched successfully",
        workspaces: workspaces,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching workspaces",
      error: error,
    });
  }
};

exports.createWorkspace = async (req, res, next) => {
  const adminId = req.userData.adminId;
  try {
    await checkAdminExists(req, res);
    await checkWorkspaceByName(req, res);
    const newWorkspace = {
      _id: new mongoose.Types.ObjectId(),
      creator: adminId,
      name: req.body.name,
      description: req.body.description || "",
      tags: req.body.tags || [],
      creationDate: new Date(),
    };
    const response = await WorkspaceModel.create(newWorkspace);
    res.status(201).json({
      message: "Workspace created successfully",
      workspace: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating workspace",
      error: error,
    });
  }
};

exports.addMemberToWorkspace = async (req, res, next) => {
  const userId = req.userData.userId
    ? req.userData.userId
    : req.userData.adminId;
  try {
    const workspaceId =
      req.userData.workspaceId == undefined
        ? req.body.workspaceId
        : req.userData.workspaceId;
    if (!(await checkWorkspaceById(workspaceId))) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }
    const admin = await AdminModel.findById(userId, { _id: 1 });
    await checkUserExists(req, res, req.body.memberId, "Member");
    if (!admin) {
      await checkUserExists(req, res, req.userData.userId, "User");
      await checkUserAddPermission(req, res, userId, workspaceId);
    }
    if (await checkMemberExistsInWorkspace(req.body.memberId, workspaceId)) {
      return res.status(400).json({
        message: "Member already exists in this workspace",
      });
    }
    const newWorkspaceUser = {
      _id: new mongoose.Types.ObjectId(),
      workspaceId: workspaceId,
      userId: req.body.memberId,
      permissions: {
        write: req.body.permissions.write || false,
        allowAdd: req.body.permissions.allowAdd || false,
      },
      joinDate: new Date(),
    };
    const response = await WorkspaceUserModel.create(newWorkspaceUser);
    if (response) {
      const updatedUser = await UserModel.updateOne(
        {
          _id: req.body.memberId,
        },
        {
          $push: { workspaces: workspaceId },
        },
      );
    }
    res.status(201).json({
      message: "Member added to workspace successfully",
      workspaceUser: response,
    });
    //-----------------
  } catch (error) {
    return res.status(500).json({
      message: "Error adding member to workspace",
      error: error,
    });
  }
};
exports.deleteMemberFromWorkspace = async (req, res, next) => {
  const userId = req.userData.userId;
  const memberId = req.body.memberId;
  if (!(await checkWorkspaceById(req.userData.workspaceId))) {
    return res.status(404).json({
      message: "Workspace not found",
    });
  }
  await checkUserExists(req, res, userId, "User");
  await checkUserExists(req, res, memberId, "Member");
  if (
    (await checkMemberExistsInWorkspace(memberId, req.userData.workspaceId)) &&
    (await checkMemberExistsInWorkspace(userId, req.userData.workspaceId))
  ) {
    await checkUserAddPermission(req, res, userId, req.userData.workspaceId);
    WorkspaceUserController.removeWorkspaceUser(
      memberId,
      req.userData.workspaceId,
    );
    res.status(200).json({
      message: "Member removed from workspace successfully",
    });
  } else {
    return res.status(404).json({
      message: "Member not found in this workspace",
    });
  }
};

exports.getWorkspaceById = (req, res) => {
  const workspaceId = req.userData.workspaceId;
  WorkspaceModel.findById(workspaceId)
    .then((workspace) => {
      if (!workspace) {
        return res.status(404).json({
          message: "Workspace not found",
        });
      }
      res.status(200).json({
        message: "Workspace fetched successfully",
        workspace: workspace,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
};
exports.deleteWorkspace = async (req, res) => {
  try {
    const workspaceId = req.body.workspaceId;
    if (!(await checkWorkspaceById(workspaceId))) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }
    await checkAdminExists(req, res);
    await WorkspaceModel.deleteOne({ _id: workspaceId });
    await WorkspaceUserModel.deleteMany({ workspaceId: workspaceId });
    await UserModel.updateMany(
      { workspaces: workspaceId },
      { $pull: { workspaces: workspaceId } },
    );
    res.status(200).json({
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting workspace",
      error: error,
    });
  }
};

exports.addTagToWorkspace = async (req, res) => {
  try {
    const workspaceId = req.body.workspaceId;
    if (!(await checkWorkspaceById(workspaceId))) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }
    await checkAdminExists(req, res);
    const tags = req.body.tags;
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        message: "Tags must be a non-empty array",
      });
    }
    const updatedWorkspace = await WorkspaceModel.findByIdAndUpdate(
      workspaceId,
      { $addToSet: { tags: { $each: tags } } },
      { new: true, runValidators: true },
    );
    if (!updatedWorkspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }
    res.status(200).json({
      message: "Tags added to workspace successfully",
      workspace: updatedWorkspace,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error adding tag to workspace",
      error: error,
    });
  }
};

exports.removeTagFromWorkspace = async (req, res) => {
  try {
    const workspaceId = req.body.workspaceId;
    if (!(await checkWorkspaceById(workspaceId))) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }
    await checkAdminExists(req, res);
    const tags = req.body.tags;
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        message: "Tags must be a non-empty array",
      });
    }
    const updatedWorkspace = await WorkspaceModel.findByIdAndUpdate(
      workspaceId,
      { $pull: { tags: { $in: tags } } },
      { new: true, runValidators: true },
    );
    if (!updatedWorkspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }
    res.status(200).json({
      message: "Tags removed from workspace successfully",
      workspace: updatedWorkspace,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error removing tag from workspace",
      error: error,
    });
  }
};
exports.updateWorkspace = async (req, res) => {
  try {
    const workspaceId = req.body.workspaceId;
    if (!(await checkWorkspaceById(workspaceId))) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }
    await checkAdminExists(req, res);
    const updateData = {};
    if (req.body.name) {
      updateData.name = req.body.name;
    }
    if (req.body.description) {
      updateData.description = req.body.description;
    }
    if (req.body.tags && Array.isArray(req.body.tags)) {
      updateData.tags = req.body.tags;
    }
    const updatedWorkspace = await WorkspaceModel.findByIdAndUpdate(
      workspaceId,
      updateData,
      { new: true, runValidators: true },
    );
    if (!updatedWorkspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }
    res.status(200).json({
      message: "Workspace updated successfully",
      workspace: updatedWorkspace,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating workspace",
      error: error,
    });
  }
};

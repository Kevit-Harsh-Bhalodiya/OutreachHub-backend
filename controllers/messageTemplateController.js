const mongoose = require("mongoose");
const MessageTemplateModel = require("../models/MessageTemplateModel.js");
const UserModel = require("../models/UserModel.js");
const WorkspaceModel = require("../models/WorkspaceModel.js");
const WorkspaceUserModel = require("../models/WorkspaceUserModel.js");

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
const checkUserExists = async (userId) => {
  const user = await UserModel.findById(userId, { _id: 1 });
  if (!user) {
    return false;
  }
  return true;
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
const checkUserEditPermission = async (userId, workspaceId) => {
  const user = await WorkspaceUserModel.findOne({
    userId: userId,
    workspaceId: workspaceId,
    "permissions.write": true,
  });
  if (!user) {
    return false;
  }
  return true;
};
const checkMessageTemplateExists = async (messageTemplateId, workspaceId) => {
  const messageTemplate = await MessageTemplateModel.findOne(
    { _id: messageTemplateId, workspaceId: workspaceId },
    { _id: 1 },
  );
  if (!messageTemplate) {
    return false;
  }
  return true;
};
// get all message templates by workspace
exports.getAllMessageTemplates = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId))
    ) {
      const messageTemplates = await MessageTemplateModel.find({
        workspaceId: workspaceId,
      });
      return res.status(200).json({
        message: "Message templates fetched successfully",
        messageTemplates: messageTemplates,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};
// get message template by id
exports.getMessageTemplateById = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    const messageTemplateId = req.params.messageTemplateId;
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId))
    ) {
      const messageTemplate = await MessageTemplateModel.findOne({
        _id: messageTemplateId,
        workspaceId: workspaceId,
      });
      if (!messageTemplate) {
        return res.status(404).json({
          message: "Message template not found",
        });
      }
      return res.status(200).json({
        message: "Message template fetched successfully",
        data: messageTemplate,
      });
    }
    return res.status(400).json({
      message: "Invalid user or workspace",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

// create new message template
exports.createMessageTemplate = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId)) &&
      (await checkUserEditPermission(userId, workspaceId))
    ) {
      const newMessageTemplate = {
        _id: new mongoose.Types.ObjectId(),
        workspaceId: workspaceId,
        type: req.body.type || "text",
        title: req.body.title,
        templateImage: req.body.templateImage,
        template: req.body.template,
      };
      const response = await MessageTemplateModel.create(newMessageTemplate);
      if (!response) {
        return res.status(400).json({
          message: "Failed to create message template",
        });
      }
      return res.status(201).json({
        message: "Message template created successfully",
        response: response,
      });
    }
    return res.status(400).json({
      message: "Invalid user or workspace or insufficient permissions",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

// update message template
exports.editMessageTemplate = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    const messageTemplateId = req.params.messageTemplateId;
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId)) &&
      (await checkUserEditPermission(userId, workspaceId)) &&
      (await checkMessageTemplateExists(messageTemplateId, workspaceId))
    ) {
      const updatedMessageTemplate = {
        type: req.body.type,
        title: req.body.title,
        templateImage: req.body.templateImage,
        template: req.body.template,
      };
      const response = await MessageTemplateModel.findOneAndUpdate(
        { _id: messageTemplateId, workspaceId: workspaceId },
        updatedMessageTemplate,
        { new: true },
      );
      if (!response) {
        return res.status(400).json({
          message: "Failed to update message template",
        });
      }
      return res.status(200).json({
        message: "Message template updated successfully",
        response: response,
      });
    }
    return res.status(400).json({
      message: "Invalid user or workspace or insufficient permissions",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

// delete message template
exports.deleteMessageTemplate = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    const messageTemplateId = req.params.messageTemplateId;
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId)) &&
      (await checkUserEditPermission(userId, workspaceId)) &&
      (await checkMessageTemplateExists(messageTemplateId, workspaceId))
    ) {
      const response = await MessageTemplateModel.findOneAndDelete({
        _id: messageTemplateId,
        workspaceId: workspaceId,
      });
      if (!response) {
        return res.status(400).json({
          message: "Failed to delete message template",
        });
      }
      return res.status(200).json({
        message: "Message template deleted successfully",
      });
    }
    return res.status(400).json({
      message: "Invalid user or workspace or insufficient permissions",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

const mongoose = require("mongoose");
const CampaignModel = require("../models/CampaignModel.js");
const UserModel = require("../models/UserModel.js");
const WorkspaceModel = require("../models/WorkspaceModel.js");
const WorkspaceUserModel = require("../models/WorkspaceUserModel.js");
const ContactController = require("./contactController.js");
const MessageTemplateModel = require("../models/MessageTemplateModel.js");

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
const checkCampaignExists = async (campaignId, workspaceId) => {
  const campaign = await CampaignModel.findOne(
    {
      _id: campaignId,
      workspaceId: workspaceId,
    },
    { _id: 1, status: 1 },
  );
  if (!campaign) {
    return [false, campaign];
  }
  return [true, campaign];
};
const checkCampaignTemplateExists = async (templateId, workspaceId) => {
  const campaign = await MessageTemplateModel.findOne(
    {
      _id: templateId,
      workspaceId: workspaceId,
    },
    { _id: 1 },
  );
  if (!campaign) {
    return false;
  }
  return true;
};
// get all campaigns by workspace
exports.getAllCampaigns = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId))
    ) {
      const campaigns = await CampaignModel.find({
        workspaceId: workspaceId,
      }).populate("creator", "name email");
      if (!campaigns || campaigns.length === 0) {
        return res.status(404).json({
          message: "No campaigns found for this workspace",
        });
      }
      return res.status(200).json({
        message: "Campaigns fetched successfully",
        campaigns: campaigns,
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

// get campaign by id
exports.getCampaignById = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    const campaignId = req.params.campaignId;
    const [campaignExists, campaign] = await checkCampaignExists(
      campaignId,
      workspaceId,
    );
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId)) &&
      campaignExists
    ) {
      // const campaign = await CampaignModel.findOne({
      //   _id: campaignId,
      //   workspaceId: workspaceId,
      // }).populate("creator", "name email");
      if (!campaign) {
        return res.status(404).json({
          message: "Campaign not found",
        });
      }
      return res.status(200).json({
        message: "Campaign fetched successfully",
        campaign: campaign,
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

// get all contacts by campaign tag
exports.getContactsByCampaignTag = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    const campaignId = req.params.campaignId;
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId)) &&
      (await checkCampaignExists(campaignId, workspaceId))[0]
    ) {
      const campaign = await CampaignModel.findOne({
        _id: campaignId,
        workspaceId: workspaceId,
      }).populate("creator", "name email");
      if (!campaign) {
        return res.status(404).json({
          message: "Campaign not found",
        });
      }
      const contacts = await ContactController.getContactsByTag(
        campaign.tags,
        workspaceId,
      );
      return res.status(200).json({
        message: "Contacts fetched successfully",
        contacts: contacts,
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

// get all campaigns by userId
exports.getAllCampaignsByUserId = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    console.log("userId", userId, "workspaceId", workspaceId);
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId))
    ) {
      const campaigns = await CampaignModel.find({
        creator: userId,
        workspaceId: workspaceId,
      }).populate("creator", "name email");
      if (!campaigns || campaigns.length === 0) {
        return res.status(404).json({
          message: "No campaigns found for this user",
        });
      }
      return res.status(200).json({
        message: "Campaigns fetched successfully",
        campaigns: campaigns,
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
// get all campaign status
exports.getAllCampaignStatus = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId))
    ) {
      const campaigns = await CampaignModel.find(
        {
          workspaceId: workspaceId,
        },
        { status: 1, _id: 1, name: 1 },
      );
      if (!campaigns || campaigns.length === 0) {
        return res.status(404).json({
          message: "No campaigns found for this workspace",
        });
      }
      return res.status(200).json({
        message: "Campaign statuses fetched successfully",
        statuses: campaigns,
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
// create new campaign
exports.createCampaign = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId)) &&
      (await checkUserEditPermission(userId, workspaceId)) &&
      (await checkCampaignTemplateExists(req.body.templateId, workspaceId))
    ) {
      const campaign = {
        _id: new mongoose.Types.ObjectId(),
        workspaceId: workspaceId,
        creator: userId,
        lastModifiedBy: userId,
        templateId: req.body.templateId,
        name: req.body.name,
        creationDate: new Date(),
        tags: req.body.tags || [],
        status: req.body.status || "Draft",
        startDate: req.body.startDate,
        endDate: req.body.endDate,
      };
      const newCampaign = await CampaignModel.create(campaign);
      if (!newCampaign) {
        return res.status(500).json({
          message: "Error creating campaign",
        });
      }
      return res.status(201).json({
        message: "Campaign created successfully",
        campaign: newCampaign,
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

// update campaign
exports.updateCampaign = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    const campaignId = req.params.campaignId;
    const [campaignExists, campaign] = await checkCampaignExists(
      campaignId,
      workspaceId,
    );
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId)) &&
      (await checkUserEditPermission(userId, workspaceId)) &&
      (await checkCampaignTemplateExists(req.body.templateId, workspaceId)) &&
      campaignExists &&
      campaign.status === "Draft"
    ) {
      const updatedCampaign = {
        name: req.body.name,
        lastModifiedBy: userId,
        templateId: req.body.templateId,
        tags: req.body.tags || [],
        status: req.body.status,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
      };
      const response = await CampaignModel.findByIdAndUpdate(
        campaignId,
        updatedCampaign,
        { new: true },
      );
      if (!response) {
        return res.status(400).json({
          message: "Failed to update campaign",
        });
      }
      return res.status(200).json({
        message: "Campaign updated successfully",
        campaign: response,
      });
    }
    return res.status(400).json({
      message:
        "Invalid user or workspace or insufficient permissions or campaign status is not Draft",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

// delete campaign
exports.removeCampaign = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    const campaignId = req.params.campaignId;
    const [campaignExists, campaigs] = await checkCampaignExists(
      campaignId,
      workspaceId,
    );
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId)) &&
      (await checkUserEditPermission(userId, workspaceId)) &&
      campaignExists &&
      campaigs.status !== "Running"
    ) {
      const response = await CampaignModel.findByIdAndDelete(campaignId);
      if (!response) {
        return res.status(400).json({
          message: "Failed to delete campaign",
        });
      }
      return res.status(200).json({
        message: "Campaign deleted successfully",
      });
    }
    return res.status(400).json({
      message:
        "Invalid user or workspace or insufficient permissions or campaign status is Running",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

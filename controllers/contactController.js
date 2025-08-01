const mongoose = require("mongoose");
const ContactModel = require("../models/ContactModel.js");
const UserModel = require("../models/UserModel.js");
const WorkspaceModel = require("../models/WorkspaceModel.js");
const WorkspaceUserModel = require("../models/WorkspaceUserModel.js");

const checkWorkspaceById = async (workspaceId) => {
  const workspace = await WorkspaceModel.findById(workspaceId, {
    _id: 1,
  });
  if (!workspace) {
    console.log(`Workspace with ID ${workspaceId} not found`);
    return false;
  }
  return true;
};
const checkUserExists = async (userId) => {
  const user = await UserModel.findById(userId, { _id: 1 });
  if (!user) {
    return false;
  }
  return true;
};
const checkContactExists = async (contactId, userId, workspaceId) => {
  const contact = await ContactModel.findOne(
    {
      _id: contactId,
      creator: userId,
      workspaceId: workspaceId,
    },
    { _id: 1 },
  );
  if (!contact) {
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
  if (!workspaceUser) {
    return false;
  }
  return true;
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
// CREATE
exports.addContactByUser = async (req, res, next) => {
  try {
    if (
      (await checkWorkspaceById(req.userData.workspaceId)) &&
      (await checkUserExists(req.userData.userId)) &&
      (await checkMemberExistsInWorkspace(
        req.userData.userId,
        req.userData.workspaceId,
      )) &&
      (await checkUserEditPermission(
        req.userData.userId,
        req.userData.workspaceId,
      ))
    ) {
      const newContact = {
        _id: new mongoose.Types.ObjectId(),
        workspaceId: req.userData.workspaceId,
        creator: req.userData.userId,
        name: req.body.name,
        profilePic: req.body.profilePic,
        contactInfo: {
          countryCode: req.body.contactInfo.countryCode,
          phoneNo: req.body.contactInfo.phoneNo,
          email: req.body.contactInfo.email,
        },
        company: req.body.company,
        jobTitle: req.body.jobTitle,
        tags: req.body.tags,
      };
      const contact = await ContactModel.create(newContact);
      return res.status(201).json({
        message: "Contact added to workspace Successfully",
        contact: contact,
      });
    }
    return res.status(400).json({
      message: "Invalid request data or user does not exist",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to add contact",
      error: err,
    });
  }
};

// READ
exports.getAllContactsByWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.userData.workspaceId;
    if (
      (await checkWorkspaceById(workspaceId)) &&
      (await checkUserExists(req.userData.userId)) &&
      (await checkMemberExistsInWorkspace(req.userData.userId, workspaceId))
    ) {
      const contacts = await ContactModel.find({ workspaceId });
      if (!contacts || contacts.length === 0) {
        return res
          .status(404)
          .json({ message: "No users found in this workspace" });
      }
      return res.status(200).json({
        message: "Contacts fetched successfully",
        contacts: contacts,
      });
    }
    return res.status(400).json({
      message: "Invalid request data or user does not exist",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to get Contacts of workspace", error: err });
  }
};
exports.getAllContactsByUser = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    const workspaceId = req.userData.workspaceId;
    if (
      (await checkUserExists(userId)) &&
      (await checkWorkspaceById(workspaceId)) &&
      (await checkMemberExistsInWorkspace(userId, workspaceId))
    ) {
      const contacts = await ContactModel.find({
        workspaceId: workspaceId,
        creator: userId,
      });
      if (!contacts || contacts.length === 0) {
        return res.status(404).json({
          message: "No contacts found for this user",
        });
      }
      return res.status(200).json({
        message: "Contacts fetched successfully",
        contacts: contacts,
      });
    }
    return res.status(400).json({
      message: "Invalid request data or user does not exist",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch contacts of User",
      error: err,
    });
  }
};

// UPDATE
exports.updateContactByUser = async (req, res, next) => {
  try {
    const contactId = req.body.contactId;
    if (
      (await checkUserExists(req.userData.userId)) &&
      (await checkMemberExistsInWorkspace(
        req.userData.userId,
        req.userData.workspaceId,
      )) &&
      (await checkWorkspaceById(req.userData.workspaceId)) &&
      (await checkContactExists(
        contactId,
        req.userData.userId,
        req.userData.workspaceId,
      ))
    ) {
      const updateFields = {
        name: req.body.name,
        profilePic: req.body.profilePic,
        contactInfo: {
          countryCode: req.body.contactInfo.countryCode,
          phoneNo: req.body.contactInfo.phoneNo,
          email: req.body.contactInfo.email,
        },
        company: req.body.company,
        jobTitle: req.body.jobTitle,
        tags: req.body.tags,
      };
      const response = await ContactModel.updateOne(
        {
          _id: contactId,
          creator: req.userData.userId,
          workspaceId: req.userData.workspaceId,
        },
        updateFields,
      );
      if (res.nModified === 0) {
        return res.status(404).json({
          message: "Contact not found or no changes made",
        });
      }
      return res.status(200).json({
        message: "Contact updated successfully",
        response: response,
      });
    }
    return res.status(400).json({
      message:
        "Invalid request data or contact does not exist or you do not have permission to update this contact",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to update contact",
      error: err,
    });
  }
};

// DELETE
exports.deleteContactByUser = async (req, res, next) => {
  const contactId = req.params.contactId;
  try {
    if (
      (await checkWorkspaceById(req.userData.workspaceId)) &&
      (await checkUserExists(req.userData.userId)) &&
      (await checkMemberExistsInWorkspace(
        req.userData.userId,
        req.userData.workspaceId,
      )) &&
      (await checkUserEditPermission(
        req.userData.userId,
        req.userData.workspaceId,
      ))
    ) {
      const deleted = await ContactModel.deleteOne({
        _id: contactId,
        creator: req.userData.userId,
        workspaceId: req.userData.workspaceId,
      });
      if (deleted.deletedCount === 0) {
        return res.status(404).json({
          message: "Contact not found or not authorized to delete",
        });
      }
      return res.status(200).json({
        message: "Contact deleted successfully",
      });
    }
    return res.status(400).json({
      message:
        "Invalid request data or user does not exist or you do not have permission to delete this contact",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to delete contact",
      error: err,
    });
  }
};
// Edit contact
exports.editContact = async (req, res, next) => {
  try {
    const contactId = req.params.contactId;
    if (
      (await checkUserExists(req.userData.userId)) &&
      (await checkMemberExistsInWorkspace(
        req.userData.userId,
        req.userData.workspaceId,
      )) &&
      (await checkWorkspaceById(req.userData.workspaceId)) &&
      (await checkContactExists(
        contactId,
        req.userData.userId,
        req.userData.workspaceId,
      )) &&
      (await checkUserEditPermission(
        req.userData.userId,
        req.userData.workspaceId,
      ))
    ) {
      const updates = {
        name: req.body.name,
        profilePic:
          req.body.profilePic ||
          "https://www.w3schools.com/howto/img_avatar.png",
        contactInfo: {
          countryCode: req.body.contactInfo.countryCode,
          phoneNo: req.body.contactInfo.phoneNo,
          email: req.body.contactInfo.email,
        },
        company: req.body.company,
        jobTitle: req.body.jobTitle,
        tags: req.body.tags || [],
      };
      const updatedContact = await ContactModel.updateOne(
        { _id: contactId },
        updates,
        {
          runValidators: true,
        },
      );
      if (updatedContact.nModified === 0) {
        return res.status(404).json({
          message: "Contact not found or no changes made",
        });
      }
      return res.status(200).json({
        message: "Contact edited successfully",
        contact: updatedContact,
      });
    }
    return res.status(400).json({
      message:
        "Invalid request data or contact does not exist or you do not have permission to edit this contact",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to edit contact",
      error: err,
    });
  }
};
//filter contacts by tags
exports.filterContactsByTags = async (req, res, next) => {
  try {
    const tags = req.body.tags;
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        message: "Tags must be a non-empty array",
      });
    }
    if (
      !(await checkWorkspaceById(req.userData.workspaceId)) ||
      !(await checkUserExists(req.userData.userId)) ||
      !(await checkMemberExistsInWorkspace(
        req.userData.userId,
        req.userData.workspaceId,
      ))
    ) {
      return res.status(400).json({
        message: "Invalid workspace or user",
      });
    }
    const contacts = await ContactModel.find({
      workspaceId: req.userData.workspaceId,
      tags: { $in: tags },
    });
    if (!contacts || contacts.length === 0) {
      return res.status(404).json({
        message: "No contacts found with the specified tags",
      });
    }
    res.status(200).json({
      message: "Contacts filtered by tags successfully",
      contacts: contacts,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to filter contacts by tags",
      error: err,
    });
  }
};
// get contacts by tag
exports.getContactsByTag = async (tags, workspaceId) => {
  try {
    let contacts = [];
    contacts = await ContactModel.find({
      workspaceId: workspaceId,
      tags: { $in: tags },
    });
    return contacts;
  } catch (err) {
    console.error("Failed to fetch contacts by tag", err);
    // throw new Error("Failed to fetch contacts by tag", err);
  }
};

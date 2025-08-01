const express = require("express");
const router = express.Router();
const CampaignController = require("../controllers/campaignController.js");
const auth = require("../middlewares/auth.js");

// create new campaign
router.post("/", auth, CampaignController.createCampaign);
// remove campaign
router.delete("/:campaignId", auth, CampaignController.removeCampaign);
// update campaign
router.patch("/:campaignId", auth, CampaignController.updateCampaign);
// get all campaigns
router.get("/", auth, CampaignController.getAllCampaigns);
// get campaign by id
router.get("/user", auth, CampaignController.getAllCampaignsByUserId);
// get all campaign status
router.get(
  "/status",
  auth,
  CampaignController.getAllCampaignStatus,
);
router.get("/:campaignId", auth, CampaignController.getCampaignById);
// get all contacts by campaign tag (open campaign page -> filtered contact by tag)
router.get(
  "/:campaignId/contacts",
  auth,
  CampaignController.getContactsByCampaignTag,
);
// get all campaigns by userId
module.exports = router;

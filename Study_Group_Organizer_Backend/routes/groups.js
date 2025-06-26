import express from "express";
import dotenv from "dotenv";
import { getCoordinatesGoogle } from "./shared.js";
import { geocoder } from "../index.js";
import crypto from "crypto";
import QRCode from "qrcode";
import Group from "../models/Group.js";
import User from "../models/User.js";
import City from "../models/City.js";
import Subject from "../models/Subjects.js";

const router = express.Router();
dotenv.config();

router.post("/createGroup", async (req, res) => {
  const { name, description, subject, privacy, creator, city } = req.body;

  const anotherGroup = await Group.findOne({ name: name });
  const user = await User.findOne({ username: creator });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const coordinates = await getCoordinatesGoogle(city);
  if (!coordinates) {
    return res.status(400).json({
      success: false,
      data: "Invalid city name or coordinates not found.",
    });
  }
  if (anotherGroup) {
    return res.send({ data: "Group name taken!", success: false });
  }

  try {
    await Group.create({
      name: name,
      description: description,
      subject: subject,
      privacy: privacy,
      creator: user._id,
      members: [],
      requests: [],
      city: city,
      location: {
        type: "Point",
        coordinates: [coordinates.lng, coordinates.lat],
      },
    });

    res.json({
      status: 201,
      success: true,
      data: "Group created successfully!",
    });
  } catch (error) {
    res.send({ status: "error", data: error });
  }
});

router.post("/checkGroupExistence", async (req, res) => {
  const { field, value } = req.body;

  if (!["name"].includes(field)) {
    return res
      .status(400)
      .send({ available: false, message: "Invalid field." });
  }

  const query = {};
  query[field] = value;

  try {
    const existingGroup = await Group.findOne(query);
    res.send({ available: !existingGroup });
  } catch (error) {
    res.status(500).send({
      available: false,
      message: "Error checking group availability.",
    });
  }
});

router.get("/fetchOwnedGroups/:username", async (req, res) => {
  try {
    const loggedUser = req.params.username;
    const user = await User.findOne({ username: loggedUser });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const groups = await Group.find({ creator: user._id })
      .populate("creator", "username")
      .populate("members", "username")
      .populate("requests", "username");

    const formattedGroups = groups.map((group) => ({
      ...group.toObject(),
      creator: group.creator.username,
      members: group.members.map((member) => member.username),
      requests: group.requests.map((request) => request.username),
    }));

    res.json({
      success: true,
      message: `Groups owned by ${loggedUser} fetch successfully!`,
      groups: formattedGroups,
    });
  } catch (error) {
    res.json("Groups have not been fetched correctly!");
  }
});

router.get("/fetchMemberGroups/:username", async (req, res) => {
  try {
    const loggedUser = req.params.username;
    const user = await User.findOne({ username: loggedUser });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const groups = await Group.find({ members: user._id })
      .populate("creator", "username")
      .populate("members", "username")
      .populate("requests", "username");

    const formattedGroups = groups.map((group) => ({
      ...group.toObject(),
      creator: group.creator.username,
      members: group.members.map((member) => member.username),
      requests: group.requests.map((request) => request.username),
    }));

    res.json({
      success: true,
      message: `Groups ${loggedUser} is a memember of fetched successfully!`,
      groups: formattedGroups,
    });
  } catch (error) {
    res.json("Groups have not been fetched correctly!");
  }
});

router.get("/fetchGroups", async (req, res) => {
  try {
    const groups = await Group.find({ privacy: "Public" })
      .populate("creator", "username")
      .populate("members", "username")
      .populate("requests", "username");

    const formattedGroups = groups.map((group) => ({
      ...group.toObject(),
      creator: group.creator?.username || group.creator,
      members: group.members.map((member) => member.username),
      requests: group.requests.map((request) => request.username),
    }));
    res.json({
      success: true,
      message: `Groups fetched successfully!`,
      groups: formattedGroups,
    });
  } catch (error) {
    res.json("Groups have not been fetched correctly!");
  }
});

router.get("/fetchGroup/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await Group.findById(groupId)
      .populate("creator", "username")
      .populate("members", "username")
      .populate("requests", "username");

    const formattedGroup = {
      ...group.toObject(),
      creator: group.creator?.username || group.creator,
      members: group.members.map((member) => member.username),
      requests: group.requests.map((request) => request.username),
    };

    res.json({
      success: true,
      message: `Group is fetched successfully!`,
      group: formattedGroup,
    });
  } catch (error) {
    res.json("Group has not been fetched correctly!");
  }
});

const normalizeCityName = (city) => {
  return city.normalize("NFD").replace(/\p{Diacritic}/gu, "");
};

router.get("/searchGroups", async (req, res) => {
  const { query, userId, lat, lng } = req.query;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    let city = "";
    if (lat && lng) {
      const geoData = await geocoder.reverse({
        lat: parseFloat(lat),
        lon: parseFloat(lng),
      });
      city = geoData[0]?.city ? normalizeCityName(geoData[0].city) : "";
    }

    if (!city) {
      return res
        .status(400)
        .json({ success: false, message: "City not found from location" });
    }

    const groups = await Group.find({
      privacy: "Public",
      city: city,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { subject: { $regex: query, $options: "i" } },
      ],
    })
      .populate("creator", "username")
      .populate("members", "username")
      .populate("requests", "username");

    const filteredGroups = groups.filter((group) => {
      return !(
        group.creator.toString() === user.username ||
        group.members.includes(user.username)
      );
    });

    const formattedGroups = filteredGroups.map((group) => ({
      ...group.toObject(),
      creator: group.creator?.username || group.creator,
      members: group.members.map((member) => member.username),
      requests: group.requests.map((request) => request.username),
    }));

    res.json({
      success: true,
      groups: formattedGroups,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error searching groups" });
  }
});

router.delete("/deleteGroup/:groupId", async (req, res) => {
  const { groupId } = req.params;
  try {
    await Group.findByIdAndDelete(groupId);
    res.json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete group" });
  }
});

router.post("/editGroup/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const { name, description, privacy, subject, city } = req.body;

  const coordinates = await getCoordinatesGoogle(city);
  if (!coordinates) {
    return res.status(400).json({
      success: false,
      data: "Invalid city name or coordinates not found.",
    });
  }
  try {
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      {
        name,
        description,
        privacy,
        subject,
        city,
        location: {
          type: "Point",
          coordinates: [coordinates.lng, coordinates.lat],
        },
      },
      { new: true }
    )
      .populate("creator", "username")
      .populate("members", "username")
      .populate("requests", "username");

    const formattedGroup = {
      ...updatedGroup.toObject(),
      creator: updatedGroup.creator?.username || updatedGroup.creator,
      members: updatedGroup.members.map((member) => member.username),
      requests: updatedGroup.requests.map((request) => request.username),
    };
    res.json({ success: true, data: formattedGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update group" });
  }
});

router.post("/leaveGroup", async (req, res) => {
  const { groupId, username } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: user._id } },
      { new: true }
    );

    res.json({ success: true, message: "You have left the group" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to leave group" });
  }
});

router.post("/sendRequestToJoin", async (req, res) => {
  const { groupId, username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $push: { requests: user._id } },
      { new: true }
    );

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    res.json({
      success: true,
      group: group,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ success: false, message: "Error updating group" });
  }
});

router.post("/acceptRequest", async (req, res) => {
  const { groupId, username } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const group = await Group.findByIdAndUpdate(
      groupId,
      {
        $push: { members: user._id },
        $pull: { requests: user._id },
      },
      { new: true }
    );
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    res.json({
      success: true,
      group: group,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ success: false, message: "Error updating group" });
  }
});

router.post("/declineRequest", async (req, res) => {
  const { groupId, username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { requests: user._id } },
      { new: true }
    );

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    res.json({
      success: true,
      group: group,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ success: false, message: "Error updating group" });
  }
});

router.post("/joinGroup", async (req, res) => {
  const { token, username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const group = await Group.findOne({ qrToken: token })
      .populate("creator", "username")
      .populate("members", "username");

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (
      group.members.some((m) => m._id.toString() === user._id.toString()) ||
      group.creator._id.toString() === user._id.toString()
    ) {
      return res.json({
        success: false,
        message: "You are already in this group.",
      });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      group._id,
      { $push: { members: user._id } },
      { new: true }
    );

    res.json({ success: true, message: "You have joined the group." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error joining group." });
  }
});

router.get("/getSubjects", async (req, res) => {
  try {
    const subjects = await Subject.find().select("key value").lean();

    res.json({
      success: true,
      subjects: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subjects",
      error: error.message,
    });
  }
});

router.get("/getCities", async (req, res) => {
  try {
    const cities = await City.find().select("key value").lean();

    res.json({
      success: true,
      cities: cities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cities",
      error: error.message,
    });
  }
});

router.post("/generateGroupQRCode", async (req, res) => {
  const { groupId, username } = req.body;
  try {
    const group = await Group.findById(groupId).populate("creator", "username");
    if (!group || group.creator.username !== username) {
      return res
        .status(403)
        .json({ message: "You are not the admin of this group." });
    }

    const token = crypto.randomBytes(8).toString("hex");

    await Group.findByIdAndUpdate(groupId, { qrToken: token });

    const frontendUrl = process.env.FRONTEND_URL;
    const qrCodeData = `${frontendUrl}/joinGroup?token=${token}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    res.json({ success: true, qrCode });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error generating QR code." });
  }
});
export default router;

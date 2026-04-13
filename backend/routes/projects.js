const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

let projects = [];

router.post("/", (req, res) => {
  const id = uuidv4();
  const project = { id, ...req.body };
  projects.push(project);
  res.json(project);
});

router.get("/:id", (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  res.json(project);
});

module.exports = router;

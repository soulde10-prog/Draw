const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const roofs = req.body.roofs;

  let total = 0;

  roofs.forEach(r => {
    const pitchRad = r.pitch * Math.PI / 180;
    const height = (r.width / 2) * Math.tan(pitchRad);
    const area = r.width * r.length / Math.cos(pitchRad);
    total += area;
  });

  res.json({ totalArea: total });
});

module.exports = router;

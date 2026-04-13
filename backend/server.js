require("dotenv").config();
const express = require("express");
const cors = require("cors");

const projectRoutes = require("./routes/projects");
const calculateRoutes = require("./routes/calculate");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/projects", projectRoutes);
app.use("/calculate", calculateRoutes);

app.listen(3001, () => console.log("API running on 3001"));

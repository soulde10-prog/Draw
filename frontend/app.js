const project = {
  roofs: []
};

function addRoof() {
  project.roofs.push({
    type: "gable",
    width: 10,
    length: 5,
    pitch: 30
  });
}

addRoof();
console.log(project);

require("dotenv").config();
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const File = require("./models/File");
const bcrypt = require("bcrypt");

const app = express();

const upload = multer({ dest: "uploads" });

mongoose.connect(process.env.MONGO_URI, () =>
  console.log("Database Connected")
);
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  };
  if (req.body.password != null && req.body.password !== "") {
    fileData.password = await bcrypt.hash(req.body.password, 10);
  }

  const file = await File.create(fileData);
  res.render("index", {
    fileLink: `${req.headers.origin}/file/${file.id}`,
    fileName: file.originalName,
  });
});

app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res) {
  const file = await File.findById(req.params.id);

  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password");
      return;
    }
  }

  if (!(await bcrypt.compare(req.body.password, file.password))) {
    res.render("password", { error: true });
    return;
  }

  file.downloadCount++;
  await file.save();
  console.log(file.downloadCount);
  res.download(file.path, file.originalName);
}

PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

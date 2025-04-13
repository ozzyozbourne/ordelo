import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const app = express();
const port = 7001;

// Fix for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Generate random string
function randomStringGenerator(size) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < size; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
}

// POST /admin/add - Add new user
app.post("/admin/add", async (req, res) => {
  try {
    let { user_id, user_name, user_address, email, password, saved_recipe, role, created_at } = req.body;

    const filePath = path.join(__dirname, "data.json");
    let fileData = await fs.readFile(filePath);
    fileData = JSON.parse(fileData);

    let userFound = fileData.find((ele) => ele.email === email);
    if (userFound) {
      return res.status(409).json({ error: "User Already Exists" });
    }

    password = await bcrypt.hash(password, 12);
    user_id = uuidv4() + randomStringGenerator(4); // Add some randomness

    let userData = { user_id, user_name, user_address, email, password, saved_recipe, role, created_at };
    fileData.push(userData);
    await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));

    return res.status(201).json({ success: "User added successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /login - User login
app.post("/login", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "data.json");
    let fileData = await fs.readFile(filePath);
    fileData = JSON.parse(fileData);

    const userFound = fileData.find((ele) => ele.email === req.body.email);
    if (!userFound) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }

    const matchPassword = await bcrypt.compare(req.body.password, userFound.password);
    if (!matchPassword) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }

    const payload = { email: userFound.email, username: userFound.user_name, role: userFound.role };
    const privateKey = "hehe";
    const token = jwt.sign(payload, privateKey, { expiresIn: "1h" });

    res.status(200).json({ success: "Login is Successful", token, role: userFound.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /auth - Token verification
app.get("/auth", (req, res) => {
  try {
    const privateKey = "hehe";
    const token = req.headers["auth-token"];

    const payload = jwt.verify(token, privateKey);
    req.payload = payload;
    return res.status(200).json(payload);
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Invalid or Expired Token" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server started at port: ${port}`);
});

// routes/favoriteRoutes.js
const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favoriteController");
const authenticate = require("../middleware/authMiddleware");

router.post("/", authenticate, favoriteController.addFavorite);
router.delete("/:wallpaperId", authenticate, favoriteController.removeFavorite);
router.get("/", authenticate, favoriteController.getFavorites);

module.exports = router;

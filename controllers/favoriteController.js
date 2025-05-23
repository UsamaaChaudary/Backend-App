// controllers/favoriteController.js
const Favorite = require("../models/Favorite");

exports.addFavorite = async (req, res) => {
    const { wallpaperId } = req.body;
    const userId = req.user.id;

    try {
        const favorite = new Favorite({ userId, wallpaperId });
        await favorite.save();
        res.status(201).json({ message: "Wallpaper added to favorites." });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Already in favorites." });
        }
        res.status(500).json({ message: "Error adding favorite", error });
    }
};

exports.removeFavorite = async (req, res) => {
    const { wallpaperId } = req.params;
    const userId = req.user.id;

    try {
        await Favorite.findOneAndDelete({ userId, wallpaperId });
        res.status(200).json({ message: "Wallpaper removed from favorites." });
    } catch (error) {
        res.status(500).json({ message: "Error removing favorite", error });
    }
};

exports.getFavorites = async (req, res) => {
    const userId = req.user.id;

    try {
        const favorites = await Favorite.find({ userId }).populate("wallpaperId");
        res.status(200).json(favorites);
    } catch (error) {
        res.status(500).json({ message: "Error fetching favorites", error });
    }
};

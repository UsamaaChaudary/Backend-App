// models/Favorite.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const favoriteSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wallpaperId: { type: String, required: true },
  webformatURL: { type: String, required: true },
  largeImageURL: { type: String, required: true } , 
} , { timestamps: true});

module.exports = mongoose.model('Favorite', favoriteSchema);
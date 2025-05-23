const mongoose = require('mongoose')
const URI = ('mongodb+srv://faizan-abbas-786:Abcd%40786@lms.1dl1hkq.mongodb.net/LMS')

const connectToMongo = () => {
  mongoose.connect(URI)
}

module.exports = { connectToMongo };


const mongoose = require("mongoose");
const Schema = mongoose.Schema;


// const mongoURI = 'mongodb://127.0.0.1:27017/prostech';
// mongoose.connect(mongoURI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => {
//   console.log("MongoDB Connected");
// });

const prodSchema = new Schema({
  uri: {
    type: String,
  },
  name: {
    type: String,
  },
  price: {
    type: Number,
  },
  category: {
    type: String,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  height: {
    type: Number,
  },
  width: {
    type: Number,
  },
  depth: {
    type: Number,
  },
});

const ProdModel = mongoose.model("Prod", prodSchema);

// const prod = new Prod({
//   uri: "images/p5.png",
//   name: "Prosthetic 4",
//   price: 5000,
//   category: "Hand",
//   quantity: 100,
//   height:35,
//   width: 15,
//   depth: 3,
// });

// prod.save();
module.exports = ProdModel;

import mongoose from "mongoose";

const CitySchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

const City = mongoose.model("Cities", CitySchema);

export default City;

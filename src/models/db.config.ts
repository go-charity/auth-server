import mongoose from "mongoose";

const connect = async () => {
  const con = await mongoose.connect(
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
      ? `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@localhost:27017/${process.env.MONGODB_DB}?authSource=admin`
      : process.env.NODE_ENV === "production"
      ? `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@gocharity.sja46kp.mongodb.net/${process.env.MONGODB_DB}?retryWrites=true&w=majority`
      : ``
  );
  if (con) console.log("CONNECTED TO MONGODB DATABSE SUCCESSFULLY!");
};

export default connect;
// docker run --name mongodb-2 -p 27017:27017 -it -d -e MONGO_INITDB_ROOT_USERNAME=onukwilip -e MONGO_INITDB_ROOT_PASSWORD=wt0YWddPUuDQhCJH  mongo:jammy

import express from "express";
import { config } from "dotenv";
import cors from "cors";

config();

const app = express();
app.use(cors());

app.listen(5000, () => console.log("Auth server listening on port 5000"));

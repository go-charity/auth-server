"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connect = () => __awaiter(void 0, void 0, void 0, function* () {
    const con = yield mongoose_1.default.connect(process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
        ? `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@localhost:27017/${process.env.MONGODB_DB}?authSource=admin`
        : process.env.NODE_ENV === "production"
            ? `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@gocharity.sja46kp.mongodb.net/${process.env.MONGODB_DB}?retryWrites=true&w=majority`
            : ``);
    if (con)
        console.log("CONNECTED TO MONGODB DATABSE SUCCESSFULLY!");
});
exports.default = connect;
// docker run --name mongodb-2 -p 27017:27017 -it -d -e MONGO_INITDB_ROOT_USERNAME=onukwilip -e MONGO_INITDB_ROOT_PASSWORD=wt0YWddPUuDQhCJH  mongo:jammy

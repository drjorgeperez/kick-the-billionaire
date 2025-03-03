import AppController from "./src/controllers/AppController.js";

const publicPath = "public";
const modelPath = `${publicPath}/models/`;
const audioPath = `${publicPath}/audio/`;

const appController = new AppController(modelPath, audioPath);
appController.loadGame();
appController.runApp();

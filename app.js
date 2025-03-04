import AppController from "./src/controllers/AppController.js";

const publicPath = "public";
const modelPath = `${publicPath}/models/`;
const texturePath = `${publicPath}/textures/`;
const audioPath = `${publicPath}/audio/`;

const appController = new AppController(modelPath, texturePath, audioPath);
appController.loadGame();
appController.runApp();

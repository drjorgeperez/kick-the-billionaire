import {
  APP_BUTTONS,
  COLORS,
  GAME_STATE_LOCAL_STORAGE_KEY,
  INTERACTION,
} from "../utils/constants.js";
import { mobileCheck } from "../utils/utils.js";
import DOMController from "./DOMController.js";
import SimulationController from "./SimulationController.js";

class AppController {
  constructor(modelPath, texturePath, audioPath) {
    this.appSettings = {
      darkMode: false,
      darkModeBackgroundColor: COLORS.BLACK,
      lightModeBackgroundColor: COLORS.WHITE,
      darkModeTextColor: COLORS.WHITE,
      lightModeTextColor: COLORS.BLACK,
      darkModeButtonIconColor: COLORS.WHITE,
      lightModeButtonIconColor: COLORS.BLACK,
      darkModeButtonBackgroundColor: COLORS.BLACK,
      lightModeButtonBackgroundColor: COLORS.WHITE,
      darkModeButtonBorderColor: COLORS.WHITE,
      lightModeButtonBorderColor: COLORS.BLACK,
      toggledButtonIconColor: COLORS.AMBER,
      toggledButtonBorderColor: COLORS.AMBER,
    };
    this.simulationController = new SimulationController(
      modelPath,
      texturePath,
      audioPath,
      this.updateMoney.bind(this),
      this.updateModelLoadingLabel.bind(this)
    );
    this.domController = new DOMController(this.appSettings);
    if (!mobileCheck()) {
      document.onkeydown = this.keyboardEventHandler.bind(this);
    }
    this.money = 0;
  }

  loadGame() {
    const gameStateJson = JSON.parse(
      localStorage.getItem(GAME_STATE_LOCAL_STORAGE_KEY)
    );
    if (gameStateJson === null) return false;
    this.money = gameStateJson.money ?? 0;
    this.domController.updateMoneyLabel(this.money);
    return true;
  }

  saveGameToLocalStorage() {
    const currentGameState = {
      money: this.money,
    };
    localStorage.setItem(
      GAME_STATE_LOCAL_STORAGE_KEY,
      JSON.stringify(currentGameState)
    );
  }

  saveGame() {
    this.saveGameToLocalStorage();
  }

  runApp() {
    this.domController.setUpEventHandlers(
      this.getInteractionHandlers(),
      this.toggleDarkMode.bind(this),
      this.changeWorldGravity.bind(this),
      this.reloadScene.bind(this),
      this.toggleWorldSettingsPanel.bind(this),
      this.togglePinDummy.bind(this),
      this.updateThrowProjectileSettings.bind(this),
      this.movePress.bind(this),
      this.changePressType.bind(this),
      this.updateMeleeSettings.bind(this),
      this.moveDrawAndQuarter.bind(this),
      this.moveGuillotineBlade.bind(this),
      this.changeLightningColor.bind(this)
    );
    this.domController.onLoad(this.appSettings);
    this.simulationController.initializeThreeScene();
    this.simulationController.initializeMeshCache();
    this.simulationController.initializeCannonWorld();
    this.simulationController.render();
  }

  updateMoney(value) {
    this.money += value;
    this.domController.updateMoneyLabel(this.money);
    this.saveGame();
  }

  updateModelLoadingLabel() {
    this.domController.modelLoadingLabel.style.display = "none";
  }

  getInteractionHandlers() {
    const interactionHandlers = {};
    Object.values(INTERACTION).forEach((interaction) => {
      if (interaction === INTERACTION.NONE || interaction === INTERACTION.PIN)
        return;
      interactionHandlers[interaction] = () => {
        console.log(`Handling ${interaction}`);
      };
    });
    interactionHandlers[INTERACTION.DRAG_DUMMY] =
      this.toggleDragDummy.bind(this);
    interactionHandlers[INTERACTION.PUNCH] = this.togglePunchDummy.bind(this);
    interactionHandlers[INTERACTION.FUS_RO_DAH] =
      this.triggerFusRoDah.bind(this);
    interactionHandlers[INTERACTION.PROJECTILE] =
      this.toggleThrowProjectile.bind(this);
    interactionHandlers[INTERACTION.MELEE] = this.toggleMelee.bind(this);
    interactionHandlers[INTERACTION.PRESS] = this.togglePress.bind(this);
    interactionHandlers[INTERACTION.DRAW_AND_QUARTER] =
      this.toggleDrawAndQuarter.bind(this);
    interactionHandlers[INTERACTION.FREEZE] = this.toggleFreeze.bind(this);
    interactionHandlers[INTERACTION.GUILLOTINE] =
      this.toggleGuillotine.bind(this);
    interactionHandlers[INTERACTION.GOLDEN_WIND] =
      this.triggerGoldenWind.bind(this);
    interactionHandlers[INTERACTION.FIRE] = this.toggleFire.bind(this);
    interactionHandlers[INTERACTION.LIGHTNING] =
      this.toggleLightning.bind(this);
    return interactionHandlers;
  }

  toggleDarkMode() {
    this.appSettings.darkMode = !this.appSettings.darkMode;
    this.domController.handleDarkModeToggle(this.appSettings);
    this.domController.updateToggledIconButtonStyle(
      APP_BUTTONS.PIN,
      this.simulationController.currentClickContext === INTERACTION.PIN
    );
    this.simulationController.handleDarkModeToggle(this.appSettings);
  }

  changeWorldGravity(newValue) {
    this.simulationController.changeWorldGravity(newValue);
  }

  reloadScene() {
    this.simulationController.handleReloadScene();
  }

  toggleWorldSettingsPanel() {
    this.domController.setCurrentClickContext(
      INTERACTION.NONE,
      this.simulationController.pins.length
    );
    this.simulationController.setCurrentClickContext(INTERACTION.NONE);
    this.domController.handleInteractionSettingsPanelToggle(
      this.domController.worldSettingsPanel.id
    );
  }

  togglePinDummy() {
    if (this.simulationController.currentClickContext === INTERACTION.PIN) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.updateToggledIconButtonStyle(APP_BUTTONS.PIN, false);
      this.simulationController.handleClearAllPins();
    } else if (this.simulationController.pins.length > 0) {
      this.domController.updateToggledIconButtonStyle(APP_BUTTONS.PIN, false);
      this.simulationController.handleClearAllPins();
    } else {
      this.simulationController.setCurrentClickContext(INTERACTION.PIN);
      this.domController.setCurrentClickContext(INTERACTION.PIN);
    }
  }

  toggleDragDummy() {
    if (
      this.simulationController.currentClickContext === INTERACTION.DRAG_DUMMY
    ) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
    } else {
      this.simulationController.setCurrentClickContext(INTERACTION.DRAG_DUMMY);
      this.domController.setCurrentClickContext(
        INTERACTION.DRAG_DUMMY,
        this.simulationController.pins.length
      );
    }
  }

  togglePunchDummy() {
    if (this.simulationController.currentClickContext === INTERACTION.PUNCH) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
    } else {
      this.simulationController.setCurrentClickContext(INTERACTION.PUNCH);
      this.domController.setCurrentClickContext(
        INTERACTION.PUNCH,
        this.simulationController.pins.length
      );
    }
  }

  updateThrowProjectileSettings() {
    const projectileType = this.domController.projectileTypeSelect.value;
    const projectileMass = parseFloat(
      this.domController.projectileMassSlider.value
    );
    const projectileSpeed = parseFloat(
      this.domController.projectileSpeedSlider.value
    );
    this.simulationController.updateThrowProjectileSettings(
      projectileType,
      projectileMass,
      projectileSpeed
    );
  }

  toggleThrowProjectile() {
    if (
      this.simulationController.currentClickContext === INTERACTION.PROJECTILE
    ) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
    } else {
      this.simulationController.setCurrentClickContext(INTERACTION.PROJECTILE);
      this.domController.setCurrentClickContext(
        INTERACTION.PROJECTILE,
        this.simulationController.pins.length
      );
    }
  }

  updateMeleeSettings(newMeleeType) {
    this.simulationController.updateMeleeSettings(newMeleeType);
  }

  toggleMelee() {
    if (this.simulationController.currentClickContext === INTERACTION.MELEE) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
      this.simulationController.disableMeleeWeapon();
    } else {
      this.simulationController.setCurrentClickContext(INTERACTION.MELEE);
      this.domController.setCurrentClickContext(
        INTERACTION.MELEE,
        this.simulationController.pins.length
      );
      this.simulationController.enableMeleeWeapon();
    }
  }

  togglePress() {
    if (this.simulationController.currentClickContext === INTERACTION.PRESS) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
      this.simulationController.removePress();
      this.domController.pressCompressionPercentageSlider.value = 0;
    } else {
      this.simulationController.setCurrentClickContext(INTERACTION.PRESS);
      this.domController.setCurrentClickContext(
        INTERACTION.PRESS,
        this.simulationController.pins.length
      );
      if (this.simulationController.press === null)
        this.simulationController.spawnPress(
          this.domController.pressOrientationSelect.value,
          this.appSettings.darkMode
        );
    }
  }

  movePress(value, orientation) {
    this.simulationController.movePress(value, orientation);
  }

  changePressType(pressType) {
    this.simulationController.changePressType(
      pressType,
      this.appSettings.darkMode
    );
    this.domController.pressCompressionPercentageSlider.value = 0;
  }

  triggerFusRoDah() {
    this.simulationController.setCurrentClickContext(INTERACTION.NONE);
    this.domController.setCurrentClickContext(
      INTERACTION.NONE,
      this.simulationController.pins.length
    );
    this.simulationController.handleFusRoDah();
  }

  toggleFire() {
    if (this.simulationController.currentClickContext === INTERACTION.FIRE) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
      this.simulationController.removeFire();
    } else {
      this.simulationController.setCurrentClickContext(INTERACTION.FIRE);
      this.domController.setCurrentClickContext(
        INTERACTION.FIRE,
        this.simulationController.pins.length
      );
      this.simulationController.createFire();
    }
  }

  changeLightningColor(newLightningColor, newLightningOutlineColor) {
    this.simulationController.changeLightningColor(
      newLightningColor,
      newLightningOutlineColor
    );
  }

  toggleLightning() {
    if (
      this.simulationController.currentClickContext === INTERACTION.LIGHTNING
    ) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
      this.simulationController.removeLightning();
    } else {
      this.simulationController.setCurrentClickContext(INTERACTION.LIGHTNING);
      this.domController.setCurrentClickContext(
        INTERACTION.LIGHTNING,
        this.simulationController.pins.length
      );
      this.simulationController.createLightning(
        this.domController.lightningColorSelect.value,
        this.domController.lightningOutlineColorSelect.value
      );
    }
  }

  triggerGoldenWind() {
    this.simulationController.setCurrentClickContext(INTERACTION.NONE);
    this.domController.setCurrentClickContext(
      INTERACTION.NONE,
      this.simulationController.pins.length
    );
    this.simulationController.handleGoldenWind();
  }

  moveDrawAndQuarter(angle, stretchPercentage) {
    this.simulationController.moveDrawAndQuarter(angle, stretchPercentage);
  }

  toggleDrawAndQuarter() {
    if (
      this.simulationController.currentClickContext ===
      INTERACTION.DRAW_AND_QUARTER
    ) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
      this.simulationController.removeDrawAndQuarter();
      this.domController.drawAndQuarterAngleSlider.value = 45;
      this.domController.drawAndQuarterStretchPercentageSlider.value = 0;
    } else {
      this.simulationController.setCurrentClickContext(
        INTERACTION.DRAW_AND_QUARTER
      );
      this.domController.setCurrentClickContext(
        INTERACTION.DRAW_AND_QUARTER,
        this.simulationController.pins.length
      );
      if (this.simulationController.drawAndQuarter === null)
        this.simulationController.spawnDrawAndQuarter(
          this.domController.drawAndQuarterAngleSlider.value,
          this.domController.drawAndQuarterStretchPercentageSlider.value
        );
    }
  }

  toggleFreeze() {
    if (this.simulationController.currentClickContext === INTERACTION.FREEZE) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
      this.simulationController.handleUnfreezeDummy();
    } else {
      this.simulationController.setCurrentClickContext(INTERACTION.FREEZE);
      this.domController.setCurrentClickContext(
        INTERACTION.FREEZE,
        this.simulationController.pins.length
      );
      this.simulationController.handleFreezeDummy();
    }
  }

  toggleGuillotine() {
    if (
      this.simulationController.currentClickContext === INTERACTION.GUILLOTINE
    ) {
      this.simulationController.setCurrentClickContext(INTERACTION.NONE);
      this.domController.setCurrentClickContext(INTERACTION.NONE);
      this.simulationController.removeGuillotine();
      this.domController.guillotineDropSlider.value = 0;
    } else {
      this.simulationController.setCurrentClickContext(INTERACTION.GUILLOTINE);
      this.domController.setCurrentClickContext(
        INTERACTION.GUILLOTINE,
        this.simulationController.pins.length
      );
      if (this.simulationController.guillotine === null) {
        const worldGravity = -5;
        this.changeWorldGravity(worldGravity);
        this.domController.gravitySlider.value = worldGravity;
        this.simulationController.spawnGuillotine();
      }
    }
  }

  moveGuillotineBlade(value) {
    this.simulationController.moveGuillotineBlade(value);
  }

  keyboardEventHandler(event) {
    switch (event.key) {
      case "r":
        this.reloadScene();
        break;
      case "d":
        this.domController.darkModeCheckbox.click();
        break;
      case "p":
        this.togglePinDummy();
        break;
      case ".":
        this.domController.handleGetNextInteractions();
        break;
      case ",":
        this.domController.handleGetPreviousInteractions();
        break;
      case "e":
        this.domController.handleGetNextInteractions();
        break;
      case "q":
        this.domController.handleGetPreviousInteractions();
        break;
      case "Escape":
        this.domController.settingsButton.click();
        break;
      default:
        break;
    }
  }
}

export default AppController;

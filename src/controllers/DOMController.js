import { APP_BUTTONS, COLORS, INTERACTION } from "../utils/constants.js";
import {
  creatChevronLeftIconSvg,
  createBallPileIconSvg,
  createBaseballIconSvg,
  createBoltIconSvg,
  createChevronRightIconSvg,
  createCloseIconSvg,
  createCompressIconSvg,
  createFireIconSvg,
  createFreezeIconSvg,
  createPanToolIconSvg,
  createPushPinIconSvg,
  createRecordVoiceIconSvg,
  createRefreshIconSvg,
  createSawIconSvg,
  createSettingsIconSvg,
  createSportsMartialArtsIconSvg,
  createSportsMmaIconSvg,
} from "../utils/iconUtils.js";
import { arraySlice, mobileCheck } from "../utils/utils.js";

class DOMController {
  constructor(appSettings) {
    this.appSettings = appSettings;
    this.appTitle = document.getElementById("app-title");
    this.moneyLabel = document.getElementById("money-label");
    this.modelLoadingLabel = document.getElementById("model-loading-label");
    this.settingsButton = document.getElementById("settings-button");
    this.pinButton = document.getElementById("pin-button");
    this.reloadSceneButton = document.getElementById("reload-scene-button");
    this.settingsContainer = document.getElementById("settings-container");
    this.worldSettingsPanel = document.getElementById("world-settings-panel");
    this.gravitySlider = document.getElementById("gravity-slider");
    this.gravitySliderLabel = document.getElementById("gravity-slider-label");
    this.darkModeCheckbox = document.getElementById("dark-mode-checkbox");
    this.darkModeCheckboxLabel = document.getElementById(
      "dark-mode-checkbox-label"
    );
    this.projectileSettingsPanel = document.getElementById(
      "projectile-settings-panel"
    );
    this.projectileTypeSelect = document.getElementById(
      "projectile-type-select"
    );
    this.projectileMassSlider = document.getElementById(
      "projectile-mass-slider"
    );
    this.projectileMassSliderLabel = document.getElementById(
      "projectile-mass-slider-label"
    );
    this.projectileSpeedSlider = document.getElementById(
      "projectile-speed-slider"
    );
    this.projectileSpeedSliderLabel = document.getElementById(
      "projectile-speed-slider-label"
    );
    this.meleeSettingsPanel = document.getElementById("melee-settings-panel");
    this.meleeTypeSelect = document.getElementById("melee-type-select");
    this.pressSettingsPanel = document.getElementById("press-settings-panel");
    this.pressOrientationSelect = document.getElementById(
      "press-orientation-select"
    );
    this.pressCompressionPercentageSlider = document.getElementById(
      "press-compression-percentage-slider"
    );
    this.drawAndQuarterSettingsPanel = document.getElementById(
      "drawAndQuarter-settings-panel"
    );
    this.drawAndQuarterStretchPercentageSlider = document.getElementById(
      "drawAndQuarter-stretch-percentage-slider"
    );
    this.drawAndQuarterAngleSlider = document.getElementById(
      "drawAndQuarter-angle-slider"
    );
    this.guillotineSettingsPanel = document.getElementById(
      "guillotine-settings-panel"
    );
    this.guillotineDropSlider = document.getElementById(
      "guillotine-drop-slider"
    );
    this.lightningSettingsPanel = document.getElementById(
      "lightning-settings-panel"
    );
    this.lightningColorSelect = document.getElementById(
      "lightning-color-select"
    );
    this.lightningOutlineColorSelect = document.getElementById(
      "lightning-outline-color-select"
    );
    this.settingsElements = this.registerSettingsElements();
    this.getLeftInteractionsButton = document.getElementById(
      "get-left-interactions-button"
    );
    this.getRightInteractionsButton = document.getElementById(
      "get-right-interactions-button"
    );
    this.numberInteractionButtons = mobileCheck() ? 1 : 5;
    this.currentInteractionsIndex = 0;
    this.interactionButtonsContainer = document.getElementById(
      "interaction-buttons"
    );
    this.interactionHandlers = {};
    this.interactionButtons = [];
    this.currentClickContext = INTERACTION.NONE;
  }

  onLoad(appSettings) {
    this.handleDarkModeToggle(appSettings);
    if (mobileCheck()) this.formatInteractionSettingsPanelForMobile();
  }

  formatMoneyLabel(value) {
    const suffixes = ["", "K", "M", "B", "T"];
    let suffixIndex = 0;
    while (value >= 1000) {
      value /= 1000;
      suffixIndex++;
      if (suffixIndex >= suffixes.length - 1) break;
    }
    return `$${value.toFixed(2)}${suffixes[suffixIndex]}`;
  }

  updateMoneyLabel(value) {
    this.moneyLabel.innerText = this.formatMoneyLabel(value);
  }

  getThemeColor(appSettings) {
    const settings = appSettings ?? this.appSettings;
    let iconColor = COLORS.BLACK;
    let backgroundColor = COLORS.WHITE;
    let borderColor = COLORS.BLACK;
    let textColor = COLORS.BLACK;
    if (settings.darkMode) {
      iconColor = settings.darkModeButtonIconColor;
      backgroundColor = settings.darkModeButtonBackgroundColor;
      borderColor = settings.darkModeButtonBorderColor;
      textColor = settings.darkModeTextColor;
    } else {
      iconColor = settings.lightModeButtonIconColor;
      backgroundColor = settings.lightModeButtonBackgroundColor;
      borderColor = settings.lightModeButtonBorderColor;
      textColor = settings.lightModeTextColor;
    }
    return {
      iconColor: iconColor,
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      textColor: textColor,
    };
  }

  updateIconButtonStyle(
    buttonElement,
    buttonName,
    iconColor = COLORS.BLACK,
    backgroundColor = COLORS.WHITE,
    borderColor = COLORS.BLACK
  ) {
    let buttonIconSvg;
    switch (buttonName) {
      case APP_BUTTONS.SETTINGS:
        buttonIconSvg = createSettingsIconSvg(iconColor);
        break;
      case APP_BUTTONS.PIN:
        buttonIconSvg = createPushPinIconSvg(iconColor);
        break;
      case APP_BUTTONS.RELOAD:
        buttonIconSvg = createRefreshIconSvg(iconColor);
        break;
      case APP_BUTTONS.GET_LEFT_PROPS:
        buttonIconSvg = creatChevronLeftIconSvg(iconColor);
        break;
      case APP_BUTTONS.GET_RIGHT_PROPS:
        buttonIconSvg = createChevronRightIconSvg(iconColor);
        break;
      default:
        break;
    }
    if (!buttonIconSvg) return;
    const buttonIconBlob = new Blob([buttonIconSvg], {
      type: "image/svg+xml",
    });
    const buttonIconUrl = URL.createObjectURL(buttonIconBlob);
    buttonElement.src = buttonIconUrl;
    buttonElement.style.background = backgroundColor;
    buttonElement.style.border = this.formatBorderCssString(borderColor);
    buttonElement.addEventListener(
      "load",
      () => URL.revokeObjectURL(buttonIconUrl),
      { once: true }
    );
  }

  updateToggledIconButtonStyle(buttonName, toggled) {
    let button;
    switch (buttonName) {
      case APP_BUTTONS.PIN:
        button = this.pinButton;
        break;
      default:
        break;
    }
    if (!button) return;
    const { iconColor, backgroundColor, borderColor } = this.getThemeColor();
    this.updateIconButtonStyle(
      button,
      buttonName,
      toggled ? this.appSettings.toggledButtonIconColor : iconColor,
      backgroundColor,
      toggled ? this.appSettings.toggledButtonBorderColor : borderColor
    );
  }

  updateIconButtonStyles() {
    const { iconColor, backgroundColor, borderColor } = this.getThemeColor();
    this.updateIconButtonStyle(
      this.settingsButton,
      APP_BUTTONS.SETTINGS,
      iconColor,
      backgroundColor,
      borderColor
    );
    this.updateIconButtonStyle(
      this.pinButton,
      APP_BUTTONS.PIN,
      iconColor,
      backgroundColor,
      borderColor
    );
    this.updateIconButtonStyle(
      this.reloadSceneButton,
      APP_BUTTONS.RELOAD,
      iconColor,
      backgroundColor,
      borderColor
    );
    this.updateIconButtonStyle(
      this.getLeftInteractionsButton,
      APP_BUTTONS.GET_LEFT_PROPS,
      iconColor,
      backgroundColor,
      borderColor
    );
    this.updateIconButtonStyle(
      this.getRightInteractionsButton,
      APP_BUTTONS.GET_RIGHT_PROPS,
      iconColor,
      backgroundColor,
      borderColor
    );
  }

  createInteractionButtonIconSvg(interactionName, iconColor, backgroundColor) {
    const interactionIcon = document.createElement("img");
    interactionIcon.classList.add("interaction-icon");
    let iconSvg;
    switch (interactionName) {
      case INTERACTION.DRAG_DUMMY:
        iconSvg = createPanToolIconSvg(iconColor);
        break;
      case INTERACTION.PROJECTILE:
        iconSvg = createBallPileIconSvg(iconColor);
        break;
      case INTERACTION.MELEE:
        iconSvg = createBaseballIconSvg(iconColor);
        break;
      case INTERACTION.PRESS:
        iconSvg = createCompressIconSvg(iconColor);
        break;
      case INTERACTION.FUS_RO_DAH:
        iconSvg = createRecordVoiceIconSvg(iconColor);
        break;
      case INTERACTION.PUNCH:
        iconSvg = createSportsMmaIconSvg(iconColor);
        break;
      case INTERACTION.DRAW_AND_QUARTER:
        iconSvg = createCloseIconSvg(iconColor);
        break;
      case INTERACTION.FREEZE:
        iconSvg = createFreezeIconSvg(iconColor);
        break;
      case INTERACTION.GUILLOTINE:
        iconSvg = createSawIconSvg(iconColor);
        break;
      case INTERACTION.GOLDEN_WIND:
        iconSvg = createSportsMartialArtsIconSvg(iconColor);
        break;
      case INTERACTION.FIRE:
        iconSvg = createFireIconSvg(iconColor);
        break;
      case INTERACTION.LIGHTNING:
        iconSvg = createBoltIconSvg(iconColor);
        break;
      default:
        break;
    }
    if (!iconSvg) return;
    const iconBlob = new Blob([iconSvg], {
      type: "image/svg+xml",
    });
    const iconUrl = URL.createObjectURL(iconBlob);
    interactionIcon.src = iconUrl;
    interactionIcon.style.background = backgroundColor;
    interactionIcon.addEventListener(
      "load",
      () => URL.revokeObjectURL(iconUrl),
      { once: true }
    );
    return interactionIcon;
  }

  createInteractionButton(
    interactionName,
    onClick,
    iconColor = COLORS.BLACK,
    backgroundColor = COLORS.WHITE,
    borderColor = COLORS.BLACK,
    textColor = COLORS.BLACK
  ) {
    const interactionSelectionBox = document.createElement("div");
    interactionSelectionBox.id = `${interactionName}-button`;
    interactionSelectionBox.classList.add("interaction-selection-box");
    interactionSelectionBox.style.background = backgroundColor;
    interactionSelectionBox.style.border =
      this.formatBorderCssString(borderColor);

    const interactionIcon = this.createInteractionButtonIconSvg(
      interactionName,
      iconColor,
      backgroundColor
    );
    if (interactionIcon) {
      interactionSelectionBox.appendChild(interactionIcon);
    } else {
      const interactionText = document.createElement("span");
      interactionText.classList.add("interaction-text");
      interactionText.innerText = interactionName;
      interactionText.style.color = textColor;

      interactionSelectionBox.appendChild(interactionText);
    }

    interactionSelectionBox.addEventListener("click", onClick);

    return interactionSelectionBox;
  }

  findInteractionButtonById(interactionName) {
    return this.interactionButtons.find(
      (button) => button.id === `${interactionName}-button`
    );
  }

  updateToggledInteractionButtonStyle(interactionName, toggled) {
    const button = this.findInteractionButtonById(interactionName);
    if (!button) return;
    button.innerHTML = "";
    const { iconColor, backgroundColor, borderColor } = this.getThemeColor();
    const interactionIcon = this.createInteractionButtonIconSvg(
      interactionName,
      toggled ? this.appSettings.toggledButtonIconColor : iconColor,
      backgroundColor
    );
    button.style.border = this.formatBorderCssString(
      toggled ? this.appSettings.toggledButtonBorderColor : borderColor
    );
    if (interactionIcon) {
      button.appendChild(interactionIcon);
    }
  }

  updateInteractionButtons() {
    const { iconColor, backgroundColor, borderColor, textColor } =
      this.getThemeColor();
    const interactionTypes = Object.values(INTERACTION).filter(
      (interaction) =>
        interaction !== INTERACTION.NONE && interaction !== INTERACTION.PIN
    );
    const selectableInteractions = arraySlice(
      interactionTypes,
      this.currentInteractionsIndex,
      (this.currentInteractionsIndex + 1) * this.numberInteractionButtons
    ).slice(0, this.numberInteractionButtons);
    this.interactionButtonsContainer.innerHTML = "";
    this.interactionButtons = [];
    selectableInteractions.forEach((interaction) => {
      if (!this.interactionHandlers[interaction]) return;
      const interactionButton = this.createInteractionButton(
        interaction,
        this.interactionHandlers[interaction],
        this.currentClickContext === interaction
          ? this.appSettings.toggledButtonIconColor
          : iconColor,
        backgroundColor,
        this.currentClickContext === interaction
          ? this.appSettings.toggledButtonBorderColor
          : borderColor,
        textColor
      );
      this.interactionButtons.push(interactionButton);
      this.interactionButtonsContainer.appendChild(interactionButton);
    });
  }

  setCurrentClickContext(newClickContext = INTERACTION.NONE, pins = null) {
    const previousClickContext = this.currentClickContext;
    const interactionsWithSettings = [
      INTERACTION.PROJECTILE,
      INTERACTION.MELEE,
      INTERACTION.PRESS,
      INTERACTION.DRAW_AND_QUARTER,
      INTERACTION.GUILLOTINE,
      INTERACTION.LIGHTNING,
    ];
    const standardInteractions = [
      INTERACTION.DRAG_DUMMY,
      INTERACTION.PUNCH,
      INTERACTION.FUS_RO_DAH,
      INTERACTION.FREEZE,
      INTERACTION.GOLDEN_WIND,
      INTERACTION.FIRE,
    ];
    if (interactionsWithSettings.includes(previousClickContext)) {
      this.updateToggledInteractionButtonStyle(previousClickContext, false);
      this.handleInteractionSettingsPanelToggle(previousClickContext);
    } else if (standardInteractions.includes(previousClickContext)) {
      this.updateToggledInteractionButtonStyle(previousClickContext, false);
    } else if (pins !== null && pins === 0) {
      this.updateToggledIconButtonStyle(APP_BUTTONS.PIN, false);
    }
    this.currentClickContext = newClickContext;
    if (interactionsWithSettings.includes(newClickContext)) {
      this.updateToggledInteractionButtonStyle(newClickContext, true);
      this.handleInteractionSettingsPanelToggle(newClickContext);
    } else if (standardInteractions.includes(newClickContext)) {
      this.updateToggledInteractionButtonStyle(newClickContext, true);
    } else if (newClickContext === INTERACTION.PIN) {
      this.updateToggledIconButtonStyle(APP_BUTTONS.PIN, true);
    }
  }

  getSettingPanelById(settingId) {
    return this.settingsContainer.querySelector(`#${settingId}`);
  }

  getAllSettingsPanels() {
    return Array.from(
      this.settingsContainer.getElementsByClassName("settings-panel")
    );
  }

  updateActiveSettingsPanel(settingId) {
    const settingsPanels = this.getAllSettingsPanels();
    settingsPanels.forEach((panel) => {
      panel.style.display = panel.id === settingId ? "flex" : "none";
    });
  }

  updateAllSettingsPanelsStyle() {
    const { backgroundColor, borderColor, textColor } = this.getThemeColor();
    const settingsPanels = this.getAllSettingsPanels();
    settingsPanels.forEach((panel) => {
      panel.style.background = backgroundColor;
      panel.style.border = this.formatBorderCssString(borderColor);
      Object.keys(this.settingsElements[panel.id]).forEach(
        (settingElementId) => {
          if (settingElementId.includes("label")) {
            this.settingsElements[panel.id][settingElementId].style.color =
              textColor;
          }
        }
      );
    });
  }

  formatInteractionSettingsPanelForMobile() {
    const settingsPanels = this.getAllSettingsPanels();
    settingsPanels.forEach((panel) => {
      panel.style.flexDirection = "column";
    });
  }

  registerSettingsElements() {
    const settingsElements = {};
    settingsElements[this.worldSettingsPanel.id] = {
      "gravity-slider": this.gravitySlider,
      "gravity-slider-label": this.gravitySliderLabel,
      "dark-mode-checkbox": this.darkModeCheckbox,
      "dark-mode-checkbox-label": this.darkModeCheckboxLabel,
    };
    settingsElements[this.projectileSettingsPanel.id] = {
      "projectile-type-select": this.projectileTypeSelect,
      "projectile-mass-slider-label": this.projectileMassSliderLabel,
      "projectile-speed-slider-label": this.projectileSpeedSliderLabel,
    };
    settingsElements[this.meleeSettingsPanel.id] = {};
    settingsElements[this.pressSettingsPanel.id] = {};
    settingsElements[this.drawAndQuarterSettingsPanel.id] = {};
    settingsElements[this.guillotineSettingsPanel.id] = {};
    settingsElements[this.lightningSettingsPanel.id] = {};
    return settingsElements;
  }

  formatBorderCssString(borderColor) {
    return `1px solid ${borderColor}`;
  }

  ////////// EVENT HANDLERS //////////
  setUpEventHandlers(
    interactionHandlers,
    toggleDarkMode,
    changeWorldGravity,
    reloadScene,
    toggleWorldSettingsPanel,
    togglePinDummy,
    updateThrowProjectileSettings,
    movePress,
    changePressType,
    updateMeleeSettings,
    moveDrawAndQuarter,
    moveGuillotineBlade,
    changeLightningColor
  ) {
    this.interactionHandlers = interactionHandlers;
    this.settingsButton.addEventListener("click", toggleWorldSettingsPanel);
    this.darkModeCheckbox.addEventListener("change", toggleDarkMode);
    this.gravitySlider.addEventListener("input", (event) =>
      changeWorldGravity(event.target.value)
    );
    this.reloadSceneButton.addEventListener("click", reloadScene);
    this.getLeftInteractionsButton.addEventListener(
      "click",
      this.handleGetPreviousInteractions.bind(this)
    );
    this.getRightInteractionsButton.addEventListener(
      "click",
      this.handleGetNextInteractions.bind(this)
    );
    this.pinButton.addEventListener("click", togglePinDummy);
    this.projectileTypeSelect.addEventListener(
      "change",
      updateThrowProjectileSettings
    );
    this.projectileMassSlider.addEventListener(
      "input",
      updateThrowProjectileSettings
    );
    this.projectileSpeedSlider.addEventListener(
      "input",
      updateThrowProjectileSettings
    );
    this.pressCompressionPercentageSlider.addEventListener("input", (event) =>
      movePress(event.target.value, this.pressOrientationSelect.value)
    );
    this.pressOrientationSelect.addEventListener("change", (event) =>
      changePressType(event.target.value)
    );
    this.meleeTypeSelect.addEventListener("change", (event) =>
      updateMeleeSettings(event.target.value)
    );
    this.drawAndQuarterAngleSlider.addEventListener("input", (event) =>
      moveDrawAndQuarter(
        event.target.value,
        this.drawAndQuarterStretchPercentageSlider.value
      )
    );
    this.drawAndQuarterStretchPercentageSlider.addEventListener(
      "input",
      (event) =>
        moveDrawAndQuarter(
          this.drawAndQuarterAngleSlider.value,
          event.target.value
        )
    );
    this.guillotineDropSlider.addEventListener("input", (event) =>
      moveGuillotineBlade(event.target.value)
    );
    this.lightningColorSelect.addEventListener("change", (event) =>
      changeLightningColor(
        event.target.value,
        this.lightningOutlineColorSelect.value
      )
    );
    this.lightningOutlineColorSelect.addEventListener("change", (event) =>
      changeLightningColor(this.lightningColorSelect.value, event.target.value)
    );
  }

  handleDarkModeToggle(appSettings) {
    this.appSettings = appSettings;
    if (appSettings.darkMode) {
      this.appTitle.style.color = appSettings.darkModeTextColor;
      this.moneyLabel.style.color = appSettings.darkModeTextColor;
    } else {
      this.appTitle.style.color = appSettings.lightModeTextColor;
      this.moneyLabel.style.color = appSettings.lightModeTextColor;
    }
    this.updateIconButtonStyles();
    this.updateInteractionButtons();
    this.updateAllSettingsPanelsStyle();
  }

  handleGetPreviousInteractions() {
    const interactionTypes = Object.values(INTERACTION).filter(
      (interaction) =>
        interaction !== INTERACTION.NONE && interaction !== INTERACTION.PIN
    );
    this.currentInteractionsIndex =
      (this.currentInteractionsIndex - 1 + interactionTypes.length) %
      interactionTypes.length;
    this.updateInteractionButtons();
  }

  handleGetNextInteractions() {
    const interactionTypes = Object.values(INTERACTION).filter(
      (interaction) =>
        interaction !== INTERACTION.NONE && interaction !== INTERACTION.PIN
    );
    this.currentInteractionsIndex =
      (this.currentInteractionsIndex + 1) % interactionTypes.length;
    this.updateInteractionButtons();
  }

  handleInteractionSettingsPanelToggle(interactionName) {
    let panel;
    if (interactionName === this.worldSettingsPanel.id) {
      panel = this.worldSettingsPanel;
    } else {
      panel = this.getSettingPanelById(`${interactionName}-settings-panel`);
    }
    if (!panel) return;
    const currentlyToggled = panel.style.display === "flex";
    this.updateActiveSettingsPanel(currentlyToggled ? "" : panel.id);
  }
  ////////// EVENT HANDLERS //////////
}

export default DOMController;

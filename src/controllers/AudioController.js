class AudioController {
  constructor(audioPath) {
    this.audioPath = audioPath;
    this.audioCache = {};
  }

  createAudio(audioFileName, audioFileType) {
    return new Audio(`${this.audioPath}${audioFileName}.${audioFileType}`);
  }

  resetAudio(audioFileName) {
    if (this.audioCache[audioFileName]) {
      this.audioCache[audioFileName].currentTime = 0;
    }
  }

  startAudio(audioFileName, audioFileType = "mp3", reset = true, loop = false) {
    if (!this.audioCache[audioFileName]) {
      this.audioCache[audioFileName] = this.createAudio(
        audioFileName,
        audioFileType
      );
    }
    if (reset) this.resetAudio(audioFileName);
    this.audioCache[audioFileName].loop = loop;
    return this.audioCache[audioFileName].play();
  }

  pauseAudio(audioFileName) {
    if (!this.audioCache[audioFileName]) return;
    this.audioCache[audioFileName].pause();
  }

  pauseAllAudio() {
    Object.values(this.audioCache).forEach((audio) => {
      audio.pause();
    });
  }

  stopAudio(audioFilename) {
    if (!this.audioCache[audioFilename]) return;
    this.audioCache[audioFilename].pause();
    this.audioCache[audioFilename].currentTime = 0;
  }

  stopAllAudio() {
    Object.keys(this.audioCache).forEach((audioFilename) => {
      this.stopAudio(audioFilename);
    });
  }

  getAudioCurrentTime(audioFileName) {
    if (!this.audioCache[audioFileName]) return;
    return this.audioCache[audioFileName].currentTime;
  }
}

export default AudioController;

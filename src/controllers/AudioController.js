class AudioController {
  constructor(audioPath) {
    this.audioPath = audioPath;
    this.currentAudioName = null;
    this.currentAudio = null;
    this.audioPlaying = false;
    this.audioCache = {};
  }

  createAudio(audio) {
    const audioFileName = audio.fileName;
    const audioFileType = audio.fileType;
    return new Audio(`${this.audioPath}${audioFileName}.${audioFileType}`);
  }

  setAudio(audio) {
    const audioFileName = audio.fileName;
    if (!this.audioCache[audioFileName]) {
      this.audioCache[audioFileName] = this.createAudio(audio);
    }
    this.currentAudio = this.audioCache[audioFileName];
    this.currentAudioName = audioFileName;
  }

  startAudio() {
    if (this.currentAudio === null || this.audioPlaying) return;
    return this.currentAudio.play();
  }

  pauseAudio() {
    if (this.currentAudio === null || !this.audioPlaying) return;
    this.currentAudio.pause();
  }

  stopAudio() {
    if (this.currentAudio === null) return;
    this.currentAudio.pause();
    this.currentAudio.currentTime = 0;
  }

  isAudioOver() {
    if (this.currentAudio === null) return false;
    return this.currentAudio.ended;
  }

  getAudioCurrentTime() {
    if (this.currentAudio === null) return 0;
    return this.currentAudio.currentTime;
  }
}

export default AudioController;

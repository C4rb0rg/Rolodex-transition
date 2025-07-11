class TiltReveal {
  constructor() {
    this.contentWrapper = document.getElementById('contentWrapper');
    this.yellowPanel = document.getElementById('yellowPanel');
    this.videoPanel = document.getElementById('videoPanel');
    this.activationOverlay = document.getElementById('activationOverlay');
    this.activateButton = document.getElementById('activateButton');
    this.instructions = document.getElementById('instructions');

    this.isActivated = false;
    this.isAnimating = false;
    this.currentState = 'hidden';
    this.yellowPanelRevealed = false;

    this.init();
    this.preventScrolling();
  }

  preventScrolling() {
    // Prevent scrolling and zooming on mobile but allow page refresh
    document.addEventListener('touchmove', (e) => {
      // Allow pull-to-refresh on mobile by checking if it's a downward swipe from top
      if (e.touches[0].clientY < 100 && e.touches[0].clientY > 0) {
        return; // Allow the default behavior for pull-to-refresh
      }
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    // Prevent double-tap zoom but allow single taps
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  init() {
    if (this.isDeviceWithGyro()) {
      this.setupActivationButton();
    } else {
      this.hideActivationOverlay();
      this.setupMouseEvents();
    }
  }

  isDeviceWithGyro() {
    return (
      typeof DeviceOrientationEvent !== 'undefined' &&
      'ontouchstart' in window &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  }

  hideActivationOverlay() {
    this.activationOverlay.classList.add('hidden');
    setTimeout(() => {
      this.activationOverlay.style.display = 'none';
    }, 500);
  }

  setupActivationButton() {
    this.activateButton.addEventListener('click', () => {
      this.requestPermissions();
    });
  }

  async requestPermissions() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          this.activateMotionSensors();
        } else {
          this.showFallbackMessage();
        }
      } else {
        this.activateMotionSensors();
      }
    } catch (error) {
      console.log('Permission request failed:', error);
      this.activateMotionSensors();
    }
  }

  activateMotionSensors() {
    this.isActivated = true;
    this.hideActivationOverlay();
    this.setupGyroscopeEvents();
  }

  showFallbackMessage() {
    this.activationOverlay.innerHTML = `
      <div class="activation-text">
        Motion sensors not available or permission denied.<br>
        You can still use mouse movement on desktop.
      </div>
    `;
    setTimeout(() => {
      this.hideActivationOverlay();
    }, 3000);
  }

  setupMouseEvents() {
    let windowWidth = window.innerWidth;

    window.addEventListener('mousemove', (e) => {
      this.updateAnimation(e.clientX, windowWidth);
    });

    window.addEventListener('resize', () => {
      windowWidth = window.innerWidth;
    });
  }

  setupGyroscopeEvents() {
    window.addEventListener('deviceorientation', (e) => {
      if (!this.isActivated) return;

      const gamma = e.gamma;

      if (gamma !== null) {
        const normalizedGamma = Math.max(-45, Math.min(45, gamma)) / 45;
        const position = (normalizedGamma + 1) / 2;
        const simulatedMouseX = position * window.innerWidth;

        this.updateAnimation(simulatedMouseX, window.innerWidth);
      }
    });
  }

  updateAnimation(mouseX, windowWidth) {
    if (this.isAnimating || this.yellowPanelRevealed) return;

    const position = mouseX / windowWidth;
    const threshold = 0.3;

    if (position < threshold) {
      this.showYellowPanel();
    }
  }

  showYellowPanel() {
    if (this.currentState === 'visible' || this.yellowPanelRevealed) return;

    this.currentState = 'visible';
    this.yellowPanelRevealed = true;
    this.isAnimating = true;

    this.contentWrapper.classList.add('rotate-out');
    this.yellowPanel.classList.add('rotate-in');

    if (this.videoPanel) {
      // Ensure video plays inline without opening native player
      this.videoPanel.play().catch(e => {
        console.log('Video play failed:', e);
      });
    }

    setTimeout(() => {
      this.isAnimating = false;
    }, 800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TiltReveal();
});
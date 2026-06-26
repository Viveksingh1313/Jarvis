// Web Speech API Controller

let recognition = null;
let isListening = false;
let isSpaceHeld = false;

export function initVoice() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showError('Web Speech API not supported. Please use Chrome browser.');
        showTextInput();
        return false;
    }
    
    // Initialize recognition
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    
    // Event handlers
    recognition.onstart = () => {
        isListening = true;
        updateStatus('listening', 'Listening...');
        if (window.onListeningStart) window.onListeningStart();
    };
    
    recognition.onend = () => {
        isListening = false;
        updateStatus('idle', 'Ready');
        if (window.onListeningEnd) window.onListeningEnd();
    };
    
    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
            // Final result - send to server
            if (window.onSpeechResult) {
                window.onSpeechResult(transcript);
            }
            updateInterimText('');
        } else {
            // Interim result - show in UI
            if (window.onInterimResult) {
                window.onInterimResult(transcript);
            }
            updateInterimText(transcript);
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        
        if (event.error === 'not-allowed') {
            showError('Microphone access denied. Please allow microphone access and reload.');
            showTextInput();
        } else if (event.error === 'no-speech') {
            updateStatus('idle', 'No speech detected');
        } else {
            updateStatus('idle', 'Ready');
        }
    };
    
    // Setup keyboard controls
    setupKeyboardControls();
    
    // Setup click-to-talk on canvas
    setupClickToTalk();
    
    return true;
}

export function startListening() {
    if (isListening || !recognition) return;
    
    try {
        recognition.start();
    } catch (e) {
        // Already started, ignore
        console.log('Recognition already active');
    }
}

export function stopListening() {
    if (!isListening || !recognition) return;
    
    try {
        recognition.stop();
    } catch (e) {
        console.log('Recognition already stopped');
    }
}

function setupKeyboardControls() {
    // Spacebar = push-to-talk
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isSpaceHeld && !isInputFocused()) {
            e.preventDefault();
            isSpaceHeld = true;
            startListening();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && isSpaceHeld) {
            e.preventDefault();
            isSpaceHeld = false;
            stopListening();
        }
    });
}

function setupClickToTalk() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.warn('Canvas element not found for click-to-talk');
        return;
    }
    
    let clickTimeout = null;
    
    canvas.addEventListener('click', () => {
        // Double-click prevention
        if (clickTimeout) return;
        
        clickTimeout = setTimeout(() => {
            clickTimeout = null;
        }, 300);
        
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    });
}

function isInputFocused() {
    const active = document.activeElement;
    return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
}

function updateStatus(state, text) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    if (statusDot) {
        statusDot.className = state;
    }
    
    if (statusText) {
        statusText.textContent = text;
    }
}

function updateInterimText(text) {
    const interimEl = document.getElementById('interim-text');
    if (interimEl) {
        interimEl.textContent = text;
    }
}

function showError(message) {
    const existing = document.querySelector('.error-message');
    if (existing) existing.remove();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

function showTextInput() {
    const container = document.getElementById('text-input-container');
    if (container) {
        container.classList.add('visible');
    }
}

export function setStatusFromExternal(state, text) {
    updateStatus(state, text);
}

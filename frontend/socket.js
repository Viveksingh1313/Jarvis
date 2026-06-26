// WebSocket Client + Audio Playback

let ws = null;
let audioContext = null;
let audioQueue = [];
let isPlaying = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export function initSocket() {
    connect();
}

function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:8000/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0;
        updateStatus('idle', 'Connected');
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateStatus('idle', 'Disconnected');
        attemptReconnect();
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onmessage = async (event) => {
        if (event.data instanceof ArrayBuffer) {
            // Binary audio data (WAV)
            await queueAudio(event.data);
        } else {
            // JSON message
            try {
                const data = JSON.parse(event.data);
                handleMessage(data);
            } catch (e) {
                console.error('Failed to parse message:', e);
            }
        }
    };
}

function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnection attempts reached');
        updateStatus('idle', 'Connection failed');
        return;
    }
    
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
    setTimeout(connect, delay);
}

function handleMessage(data) {
    switch (data.type) {
        case 'status':
            if (data.text === 'Processing...') {
                updateStatus('processing', 'Processing...');
            } else if (data.text === 'Ready') {
                updateStatus('idle', 'Ready');
            }
            break;
            
        case 'sentence':
            addToTranscript('assistant', data.text);
            updateStatus('speaking', 'Speaking...');
            break;
            
        default:
            console.log('Unknown message type:', data.type);
    }
}

export function sendMessage(text) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
        return false;
    }
    
    // Add user message to transcript
    addToTranscript('user', text);
    
    // Send to server
    ws.send(text);
    return true;
}

async function queueAudio(arrayBuffer) {
    // Initialize audio context on first audio (must be after user interaction)
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume context if suspended
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    
    // Add to queue
    audioQueue.push(arrayBuffer);
    
    // Start playback if not already playing
    if (!isPlaying) {
        playNextInQueue();
    }
}

async function playNextInQueue() {
    if (audioQueue.length === 0) {
        isPlaying = false;
        updateStatus('idle', 'Ready');
        if (window.setAudioLevel) {
            window.setAudioLevel(0);
        }
        return;
    }
    
    isPlaying = true;
    const arrayBuffer = audioQueue.shift();
    
    try {
        // Decode WAV audio
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        
        // Create source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Create analyser for visualization
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        // Connect nodes
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Start visualization
        visualizeAudio(analyser);
        
        // Play audio
        source.start(0);
        
        // When done, play next
        source.onended = () => {
            playNextInQueue();
        };
        
    } catch (e) {
        console.error('Audio decode error:', e);
        playNextInQueue();
    }
}

function visualizeAudio(analyser) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    function update() {
        if (!isPlaying) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average amplitude (0-255) -> normalize to 0-1
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const level = average / 255;
        
        // Send to reactor
        if (window.setAudioLevel) {
            window.setAudioLevel(level);
        }
        
        // Draw waveform
        drawWaveform(dataArray);
        
        requestAnimationFrame(update);
    }
    
    update();
}

function drawWaveform(dataArray) {
    const canvas = document.getElementById('waveform');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw frequency bars
    const barWidth = width / dataArray.length * 2.5;
    let x = 0;
    
    ctx.fillStyle = '#38BDF8';
    
    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        // Draw from center
        ctx.fillRect(x, height / 2 - barHeight / 2, barWidth - 1, barHeight);
        
        x += barWidth;
        if (x > width) break;
    }
}

function addToTranscript(role, text) {
    const transcript = document.getElementById('transcript');
    if (!transcript) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'message-label';
    labelDiv.textContent = role === 'user' ? 'You' : 'JARVIS';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(labelDiv);
    messageDiv.appendChild(contentDiv);
    transcript.appendChild(messageDiv);
    
    // Scroll to bottom
    transcript.scrollTop = transcript.scrollHeight;
    
    // Limit transcript length
    while (transcript.children.length > 10) {
        transcript.removeChild(transcript.firstChild);
    }
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

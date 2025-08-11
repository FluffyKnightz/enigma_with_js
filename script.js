class EnigmaMachine {
    constructor() {
        // Historical Enigma rotor wirings
        this.rotorWirings = {
            'I': 'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
            'II': 'AJDKSIRUXBLHWTMCQGZNPYFVOE',
            'III': 'BDFHJLCPRTXVZNYEIWGAKMUSQO',
            'IV': 'ESOVPZJAYQUIRHXLNFTGKDCMWB',
            'V': 'VZBRGITYUPSDNHLXAWMJQOFECK'
        };

        // Rotor notch positions (when the next rotor steps)
        this.notchPositions = {
            'I': 'Q',    // Steps when Q becomes R (position 16->17)
            'II': 'E',   // Steps when E becomes F (position 4->5)
            'III': 'V',  // Steps when V becomes W (position 21->22)
            'IV': 'J',   // Steps when J becomes K (position 9->10)
            'V': 'Z'     // Steps when Z becomes A (position 25->0)
        };

        // Historical reflector wirings
        this.reflectorWirings = {
            'B': 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
            'C': 'FVPJIAOYEDRZXWGCTKUQSBNMHL'
        };

        // Default configuration
        this.rotors = ['III', 'II', 'I'];
        this.positions = [0, 0, 0];
        this.reflector = 'B';
        this.plugboard = new Map();
        this.initialPositions = [0, 0, 0];
    }

    setRotors(rotor1, rotor2, rotor3) {
        this.rotors = [rotor1, rotor2, rotor3];
    }

    setPositions(pos1, pos2, pos3) {
        this.positions = [pos1, pos2, pos3];
        this.initialPositions = [pos1, pos2, pos3];
    }

    setReflector(reflector) {
        this.reflector = reflector;
    }

    setPlugboard(pairs) {
        this.plugboard.clear();
        const usedLetters = new Set();
        
        for (let pair of pairs) {
            if (pair.length === 2) {
                const [a, b] = pair.toUpperCase().split('');
                if (a !== b && !usedLetters.has(a) && !usedLetters.has(b)) {
                    this.plugboard.set(a, b);
                    this.plugboard.set(b, a);
                    usedLetters.add(a);
                    usedLetters.add(b);
                }
            }
        }
        return usedLetters;
    }

    rotate() {
        // Check if middle rotor is at notch position
        const middleAtNotch = this.positions[1] === (this.notchPositions[this.rotors[1]].charCodeAt(0) - 65);
        // Check if right rotor is at notch position
        const rightAtNotch = this.positions[2] === (this.notchPositions[this.rotors[2]].charCodeAt(0) - 65);

        // Double-stepping mechanism
        if (middleAtNotch) {
            // Middle and left rotors step
            this.positions[0] = (this.positions[0] + 1) % 26;
            this.positions[1] = (this.positions[1] + 1) % 26;
        } else if (rightAtNotch) {
            // Middle rotor steps
            this.positions[1] = (this.positions[1] + 1) % 26;
        }

        // Right rotor always steps
        this.positions[2] = (this.positions[2] + 1) % 26;
    }

    processLetter(letter) {
        if (!/[A-Z]/.test(letter)) return letter;

        // Apply plugboard (first time)
        let current = this.plugboard.has(letter) ? this.plugboard.get(letter) : letter;
        
        this.rotate();

        // Convert letter to number (0-25)
        current = current.charCodeAt(0) - 65;

        // Forward through rotors
        for (let i = 2; i >= 0; i--) {
            // Apply rotor position offset
            current = (current + this.positions[i]) % 26;
            // Through rotor
            current = this.rotorWirings[this.rotors[i]].charAt(current).charCodeAt(0) - 65;
            // Remove rotor position offset
            current = (current - this.positions[i] + 26) % 26;
        }

        // Through reflector
        current = this.reflectorWirings[this.reflector].charAt(current).charCodeAt(0) - 65;

        // Backward through rotors
        for (let i = 0; i < 3; i++) {
            // Apply rotor position offset
            current = (current + this.positions[i]) % 26;
            // Through rotor (reverse)
            current = this.rotorWirings[this.rotors[i]].indexOf(String.fromCharCode(current + 65));
            // Remove rotor position offset
            current = (current - this.positions[i] + 26) % 26;
        }

        // Convert back to letter
        current = String.fromCharCode(current + 65);

        // Apply plugboard (second time)
        return this.plugboard.has(current) ? this.plugboard.get(current) : current;
    }

    processText(text) {
        this.resetToInitialPositions();
        return text.toUpperCase().split('').map(char => this.processLetter(char)).join('');
    }

    resetToInitialPositions() {
        this.positions = [...this.initialPositions];
    }
}

// UI Setup
document.addEventListener('DOMContentLoaded', () => {
    // Theme switching
    const themeToggle = document.getElementById('themeToggle');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    themeToggle.checked = savedTheme === 'light';
    
    // Theme toggle handler
    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    const enigma = new EnigmaMachine();
    const lightBoard = document.getElementById('lightBoard');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const processButton = document.getElementById('processButton');
    const downloadButton = document.getElementById('downloadButton');
    
    const rotorInputs = [
        document.getElementById('rotor1'),
        document.getElementById('rotor2'),
        document.getElementById('rotor3')
    ];

    const rotorTypeInputs = [
        document.getElementById('rotorType1'),
        document.getElementById('rotorType2'),
        document.getElementById('rotorType3')
    ];

    const reflectorType = document.getElementById('reflectorType');
    const plugboardInputs = document.querySelectorAll('.plugboard-pair');

    // Create keyboard layout
    const keyboardLayout = [
        ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Y', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    keyboardLayout.forEach((row, rowIndex) => {
        const rowElement = document.getElementById(`row${rowIndex + 1}`);
        row.forEach(letter => {
            const lightBulb = document.createElement('div');
            lightBulb.className = 'light-bulb';
            lightBulb.setAttribute('data-letter', letter);
            lightBulb.innerHTML = letter;
            rowElement.appendChild(lightBulb);

            // Add click handler for keyboard interaction
            lightBulb.addEventListener('click', () => {
                const currentText = inputText.value;
                inputText.value = currentText + letter;
                // Trigger the input event to process the new letter
                inputText.dispatchEvent(new Event('input'));
            });
        });
    });

    // Format plugboard inputs
    plugboardInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const oldValue = e.target.value;
            let newValue = oldValue.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
            
            // Get all currently used letters
            const usedLetters = new Set();
            plugboardInputs.forEach(otherInput => {
                if (otherInput !== e.target && otherInput.value.length === 2) {
                    otherInput.value.split('').forEach(letter => usedLetters.add(letter));
                }
            });

            // Validate the new input
            if (newValue.length === 2) {
                const [first, second] = newValue.split('');
                if (first === second) {
                    // Can't connect a letter to itself
                    newValue = first;
                    input.classList.add('is-invalid');
                    setTimeout(() => input.classList.remove('is-invalid'), 1000);
                } else if (usedLetters.has(first) || usedLetters.has(second)) {
                    // Letter already in use
                    newValue = oldValue.slice(0, 1);
                    input.classList.add('is-invalid');
                    setTimeout(() => input.classList.remove('is-invalid'), 1000);
                }
            }

            e.target.value = newValue;
        });

        // Add visual feedback on focus
        input.addEventListener('focus', (e) => {
            const usedLetters = new Set();
            plugboardInputs.forEach(otherInput => {
                if (otherInput !== e.target && otherInput.value.length === 2) {
                    otherInput.value.split('').forEach(letter => usedLetters.add(letter));
                }
            });

            // Add visual feedback to inputs using already connected letters
            plugboardInputs.forEach(otherInput => {
                if (otherInput !== e.target) {
                    if (otherInput.value.length === 1 && usedLetters.has(otherInput.value)) {
                        otherInput.classList.add('is-invalid');
                    }
                }
            });
        });

        // Remove visual feedback on blur
        input.addEventListener('blur', () => {
            plugboardInputs.forEach(input => {
                input.classList.remove('is-invalid');
            });
        });
    });

    // Function to generate configuration text
    function generateConfigText() {
        const rotorTypes = rotorTypeInputs.map(input => input.value);
        const rotorPositions = rotorInputs.map(input => input.value);
        const reflectorValue = reflectorType.value;
        const plugboardConnections = Array.from(plugboardInputs)
            .map(input => input.value)
            .filter(value => value.length === 2);

        const timestamp = new Date().toLocaleString();
        let configText = `ENIGMA MACHINE CONFIGURATION AND OUTPUT\n`;
        configText += `Generated: ${timestamp}\n\n`;
        configText += `ROTOR CONFIGURATION:\n`;
        configText += `Left Rotor (1):   Type ${rotorTypes[0]} at position ${rotorPositions[0]}\n`;
        configText += `Middle Rotor (2):  Type ${rotorTypes[1]} at position ${rotorPositions[1]}\n`;
        configText += `Right Rotor (3):   Type ${rotorTypes[2]} at position ${rotorPositions[2]}\n\n`;
        configText += `REFLECTOR: Type ${reflectorValue}\n\n`;
        
        if (plugboardConnections.length > 0) {
            configText += `PLUGBOARD CONNECTIONS:\n`;
            configText += plugboardConnections.map(pair => `${pair[0]} ↔ ${pair[1]}`).join('\n');
            configText += '\n\n';
        } else {
            configText += `PLUGBOARD CONNECTIONS: None\n\n`;
        }

        configText += `ENCRYPTED TEXT:\n${outputText.value || '(empty)'}\n\n`;
        configText += `----------------------------------------\n`;
        configText += `To decrypt this message:\n`;
        configText += `1. Load this configuration file\n`;
        configText += `2. The encrypted text will be automatically loaded and decrypted\n`;
        configText += `3. The original text will appear in the output field\n`;

        return configText;
    }

    // Function to download configuration
    function downloadConfig() {
        const configText = generateConfigText();
        const blob = new Blob([configText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enigma-config-${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    // Add download button handler
    downloadButton.addEventListener('click', downloadConfig);

    // Process button click
    processButton.addEventListener('click', () => {
        // Set rotor types
        enigma.setRotors(
            rotorTypeInputs[0].value,
            rotorTypeInputs[1].value,
            rotorTypeInputs[2].value
        );

        // Set rotor positions
        const positions = rotorInputs.map(input => parseInt(input.value) || 0);
        enigma.setPositions(...positions);

        // Set reflector
        enigma.setReflector(reflectorType.value);

        // Set plugboard with validation
        const plugboardPairs = Array.from(plugboardInputs)
            .map(input => input.value)
            .filter(value => value.length === 2);
        const usedLetters = enigma.setPlugboard(plugboardPairs);

        // Update UI to show invalid pairs
        plugboardInputs.forEach(input => {
            if (input.value.length === 2) {
                const [a, b] = input.value.split('');
                if (!enigma.plugboard.has(a) || !enigma.plugboard.has(b)) {
                    input.classList.add('is-invalid');
                    setTimeout(() => input.classList.remove('is-invalid'), 1000);
                }
            }
        });

        // Enable download button after processing
        downloadButton.disabled = false;

        // Process text
        const input = inputText.value;
        const output = enigma.processText(input);
        outputText.value = output;

        // Reset all bulbs
        document.querySelectorAll('.light-bulb').forEach(bulb => {
            bulb.classList.remove('active');
        });

        // Light up the last processed letter
        if (output.length > 0) {
            const lastLetter = output[output.length - 1];
            const bulb = document.querySelector(`.light-bulb[data-letter="${lastLetter}"]`);
            if (bulb) {
                bulb.classList.add('active');
                setTimeout(() => bulb.classList.remove('active'), 500);
            }
        }
    });

    // Disable download button when inputs change
    [inputText, ...rotorTypeInputs, ...rotorInputs, reflectorType, ...plugboardInputs].forEach(input => {
        input.addEventListener('input', () => {
            downloadButton.disabled = true;
        });
    });

    // Add rotor control handlers
    document.querySelectorAll('.rotor-up, .rotor-down').forEach(button => {
        button.addEventListener('click', (e) => {
            const rotorNum = e.target.closest('button').dataset.rotor;
            const input = document.getElementById(`rotor${rotorNum}`);
            let value = parseInt(input.value) || 0;
            
            if (e.target.closest('button').classList.contains('rotor-up')) {
                value = (value + 1) % 26;
            } else {
                value = (value - 1 + 26) % 26;
            }
            
            input.value = value.toString().padStart(2, '0');
            
            // Trigger input event to update the machine state
            const event = new Event('input', {
                bubbles: true,
                cancelable: true,
            });
            input.dispatchEvent(event);
        });
    });

    // Add rotor reset functionality
    const resetRotorsButton = document.getElementById('resetRotors');
    resetRotorsButton.addEventListener('click', () => {
        // Reset all rotor displays to 00
        rotorInputs.forEach(input => {
            input.value = '00';
        });

        // Reset enigma machine positions
        enigma.setPositions(0, 0, 0);

        // Trigger input event to update the machine state
        rotorInputs.forEach(input => {
            const event = new Event('input', {
                bubbles: true,
                cancelable: true,
            });
            input.dispatchEvent(event);
        });

        // Disable download button since configuration changed
        downloadButton.disabled = true;
    });

    // Initialize rotor displays with padded zeros
    document.querySelectorAll('#rotor1, #rotor2, #rotor3').forEach(input => {
        input.value = '00';
    });

    // Update the real-time processing handler
    inputText.addEventListener('input', (e) => {
        const lastChar = e.target.value.slice(-1).toUpperCase();
        if (lastChar && /[A-Z]/.test(lastChar)) {
            // Reset to initial positions before processing new character
            enigma.resetToInitialPositions();
            
            // Process all text up to this point to maintain correct rotor positions
            const currentText = e.target.value.toUpperCase();
            const processedText = enigma.processText(currentText);
            
            // Update rotor positions in UI
            rotorInputs.forEach((input, i) => {
                input.value = enigma.positions[i].toString().padStart(2, '0');
            });

            // Light up the last processed letter
            document.querySelectorAll('.light-bulb').forEach(bulb => {
                bulb.classList.remove('active');
            });
            const lastProcessedChar = processedText[processedText.length - 1];
            const bulb = document.querySelector(`.light-bulb[data-letter="${lastProcessedChar}"]`);
            if (bulb) {
                bulb.classList.add('active');
                setTimeout(() => bulb.classList.remove('active'), 500);
            }
        }
    });

    // Function to parse configuration file
    function parseConfigFile(content) {
        try {
            const config = {
                rotors: [],
                positions: [],
                reflector: '',
                plugboard: [],
                encryptedText: ''
            };

            const lines = content.split('\n');
            let section = '';
            let foundDashes = false;

            for (let line of lines) {
                line = line.trim();
                
                if (line.startsWith('----------------------------------------')) {
                    foundDashes = true;
                    break; // Stop processing after the dashes
                }
                
                if (line.startsWith('ROTOR CONFIGURATION:')) {
                    section = 'rotors';
                    continue;
                } else if (line.startsWith('REFLECTOR:')) {
                    section = 'reflector';
                } else if (line.startsWith('PLUGBOARD CONNECTIONS:')) {
                    section = 'plugboard';
                } else if (line.startsWith('ENCRYPTED TEXT:')) {
                    section = 'text';
                    continue; // Skip the "ENCRYPTED TEXT:" line
                }

                if (!line || line.startsWith('Generated:')) {
                    continue;
                }

                switch (section) {
                    case 'rotors':
                        if (line.includes('Type')) {
                            const match = line.match(/Type (\w+) at position (\d+)/);
                            if (match) {
                                config.rotors.push(match[1]);
                                config.positions.push(parseInt(match[2]));
                            }
                        }
                        break;
                    case 'reflector':
                        const reflectorMatch = line.match(/Type (\w+)/);
                        if (reflectorMatch) {
                            config.reflector = reflectorMatch[1];
                        }
                        break;
                    case 'plugboard':
                        if (line !== 'None') {
                            const pair = line.split('↔').map(s => s.trim());
                            if (pair.length === 2) {
                                config.plugboard.push(pair.join(''));
                            }
                        }
                        break;
                    case 'text':
                        if (line && !line.startsWith('To decrypt')) {
                            config.encryptedText = line;
                            section = 'done'; // Stop after getting encrypted text
                        }
                        break;
                }
            }

            return config;
        } catch (error) {
            console.error('Error parsing config file:', error);
            return null;
        }
    }

    // Function to apply configuration
    function applyConfiguration(config) {
        if (!config) return false;

        try {
            // Set rotor types
            rotorTypeInputs.forEach((input, i) => {
                input.value = config.rotors[i];
            });

            // Set rotor positions
            rotorInputs.forEach((input, i) => {
                input.value = config.positions[i].toString().padStart(2, '0');
            });

            // Set reflector
            reflectorType.value = config.reflector;

            // Clear existing plugboard connections
            plugboardInputs.forEach(input => input.value = '');

            // Set plugboard connections
            config.plugboard.forEach((pair, i) => {
                if (i < plugboardInputs.length) {
                    plugboardInputs[i].value = pair;
                }
            });

            // Set encrypted text in input field for decryption
            inputText.value = config.encryptedText;
            outputText.value = ''; // Clear output field

            return true;
        } catch (error) {
            console.error('Error applying configuration:', error);
            return false;
        }
    }

    // Add file input handler
    const configFile = document.getElementById('configFile');
    configFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const config = parseConfigFile(content);
            
            if (config) {
                if (applyConfiguration(config)) {
                    // Automatically process the text to decrypt
                    processButton.click();
                    // Reset file input
                    configFile.value = '';
                    // Update UI to show decryption mode
                    inputText.setAttribute('placeholder', 'Encrypted text loaded from configuration file...');
                    outputText.setAttribute('placeholder', 'Decrypted original text will appear here...');
                } else {
                    alert('Error applying configuration. Please check the file format.');
                }
            } else {
                alert('Error parsing configuration file. Please check the file format.');
            }
        };
        reader.readAsText(file);
    });

    // Remove the input validation for rotor positions as it's no longer needed
}); 
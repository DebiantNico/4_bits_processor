// public/app.js
document.addEventListener('DOMContentLoaded', () => {

    const ws = new WebSocket(`ws://${window.location.host}`);

    // Elementos del DOM
    const calculateBtn = document.getElementById('calculateBtn');
    const numAInput = document.getElementById('numA');
    const numBInput = document.getElementById('numB');
    const opInput = document.getElementById('operation');
    const logContent = document.getElementById('log-content');
    
    // Elementos visuales
    const packet = document.getElementById('data-packet');
    const valA = document.getElementById('valA');
    const valB = document.getElementById('valB');
    const valOut = document.getElementById('valOut');
    const aluStatus = document.getElementById('alu-status');
    const flagZ = document.getElementById('flagZ');
    const flagN = document.getElementById('flagN');
    const flagV = document.getElementById('flagV'); // <-- Nuevo
    const flagC = document.getElementById('flagC');

    ws.onopen = () => log('Conectado al servidor WebSocket');
    ws.onerror = (error) => log(`Error de WebSocket: ${error.message}`);

    ws.onmessage = (event) => {
        const step = JSON.parse(event.data);
        if (step.error) {
            log(`ERROR: ${step.error}`);
            calculateBtn.disabled = false;
            return;
        }
        log(`RECIBIDO: ${step.message}`);
        animateStep(step);
    };

    calculateBtn.addEventListener('click', () => {
        resetSimulation();
        const numA = numAInput.value;
        const numB = numBInput.value;
        const operation = opInput.value;

        log(`ENVIANDO: Calcular ${numA} ${operation} ${numB}`);
        ws.send(JSON.stringify({
            type: 'calculate',
            a: numA,
            b: numB,
            op: operation
        }));
        calculateBtn.disabled = true;
    });

    function resetSimulation() {
        logContent.textContent = '';
        valA.textContent = '0000';
        valB.textContent = '0000';
        valOut.textContent = '0000';
        aluStatus.textContent = 'Idle';
        flagZ.textContent = '0';
        flagN.textContent = '0';
        flagV.textContent = '0'; // <-- Nuevo
        flagC.textContent = '0';
        packet.className = 'hidden';
    }

    async function animateStep(step) {
        
        switch (step.stage) {
            case 'start':
                packet.className = 'at-regA visible';
                valA.textContent = step.a;
                await delay(500);
                packet.className = 'move-a-alu visible';
                await delay(1000); 
                
                packet.className = 'at-regB visible';
                valB.textContent = step.b;
                await delay(500);
                packet.className = 'move-b-alu visible';
                await delay(1000);
                
                aluStatus.textContent = `Procesando...`;
                packet.className = 'hidden';
                break;

            case 'info':
            case 'bit_process':
                aluStatus.textContent = step.message;
                break;

            case 'end':
                aluStatus.textContent = 'Completado';
                
                // Actualizar TODAS las Banderas
                // Esto ya no causará error porque 'step.flags' ahora SÍ existe
                flagZ.textContent = step.flags.Z;
                flagN.textContent = step.flags.N;
                flagV.textContent = step.flags.V; // <-- Nuevo
                flagC.textContent = step.flags.C;

                await delay(800); // Espera corta para ver las banderas

                // Mover cubito a la Salida
                packet.className = 'move-alu-out visible';
                await delay(1000);

                // ACTUALIZAR REGISTRO SALIDA (esto ahora sí se ejecutará)
                valOut.textContent = step.result;
                packet.className = 'at-output visible'; 
                
                await delay(1000);
                packet.className = 'hidden'; 
                calculateBtn.disabled = false;
                break;
        }
    }

    function log(message) {
        logContent.textContent += message + '\n';
        logContent.scrollTop = logContent.scrollHeight;
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});
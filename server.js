// server.js
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;

// ¡LÍNEA DE VERIFICACIÓN!
console.log("--- ¡Servidor v4 (CON LOG DE BITS) INICIADO! ---");

/**
 * Simula la Unidad Aritmético-Lógica (ALU) de 4 bits.
 * INCLUYE EL LOG BIT A BIT PARA ADD/SUB.
 */
function simulateALU(numA, numB, operation) {
    const steps = [];
    let a = numA;
    let b = numB;
    let result = 0;
    
    let flags = { Z: 0, N: 0, C: 0, V: 0 };
    const binA = a.toString(2).padStart(4, '0');
    const binB = b.toString(2).padStart(4, '0');

    steps.push({
        stage: 'start',
        a: binA,
        b: binB,
        op: operation,
        message: `Iniciando ALU: A=${binA}, B=${binB}, Op=${operation}`
    });

    switch (operation) {
        case 'ADD':
        case 'SUB': {
            let carryIn = 0;
            let carryIntoMSB = 0;
            let carryOutOfMSB = 0;
            const sumBits = [];
            
            let opBinB = binB;
            if (operation === 'SUB') {
                carryIn = 1;
                opBinB = b.toString(2).padStart(4, '0').split('').map(bit => bit === '1' ? '0' : '1').join('');
                steps.push({ stage: 'info', message: `Resta (Comp. a 2): B_inv = ${opBinB}, Carry_In = 1` });
            }

            for (let i = 3; i >= 0; i--) {
                const bitA = parseInt(binA[i]);
                const bitB_op = parseInt(opBinB[i]);
                const carryIn_for_log = carryIn;

                if (i === 0) { carryIntoMSB = carryIn; }
                
                const sum = bitA ^ bitB_op ^ carryIn;
                carryIn = (bitA & bitB_op) | (bitB_op & carryIn) | (bitA & carryIn);

                if (i === 0) { carryOutOfMSB = carryIn; }
                
                sumBits.unshift(sum);

                // *** ¡AQUÍ ESTÁ EL LOG DETALLADO! ***
                steps.push({
                    stage: 'bit_process',
                    bit_index: 3 - i,
                    message: `Bit ${3 - i}: ${bitA} + ${bitB_op} + (Carry In: ${carryIn_for_log}) = Sum: ${sum}, Carry Out: ${carryIn}`
                });
            }
            
            result = parseInt(sumBits.join(''), 2);
            flags.V = carryIntoMSB ^ carryOutOfMSB;
            flags.C = carryOutOfMSB;
            break;
        }

        case 'AND':
            result = a & b;
            steps.push({ stage: 'info', message: `Operación lógica 'AND' completada.` });
            break;
        case 'OR':
            result = a | b;
            steps.push({ stage: 'info', message: `Operación lógica 'OR' completada.` });
            break;
        case 'NOT':
            result = ~a & 0b1111;
            steps.push({ stage: 'info', message: `Operación lógica 'NOT' completada.` });
            break;
    }

    const binResult = result.toString(2).padStart(4, '0');
    flags.Z = result === 0 ? 1 : 0;
    flags.N = parseInt(binResult[0]) === 1 ? 1 : 0;

    steps.push({
        stage: 'end',
        result: binResult,
        flags: flags,
        message: `Resultado: ${binResult} (Banderas: Z=${flags.Z}, N=${flags.N}, V=${flags.V}, C=${flags.C})`
    });

    return steps;
}

// Configuración del WebSocket
wss.on('connection', (ws) => {
    console.log('Cliente conectado');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'calculate') {
                const { a, b, op } = data;
                const numA = parseInt(a, 10);
                const numB = parseInt(b, 10);

                const simulationSteps = simulateALU(numA, numB, op);

                simulationSteps.forEach((step, index) => {
                    setTimeout(() => {
                        ws.send(JSON.stringify(step));
                    }, index * 1000); // 1 segundo por paso
                });
            }
        } catch (e) {
            console.error('Error procesando mensaje:', e);
        }
    });
    ws.on('close', () => console.log('Cliente desconectado'));
});

app.use(express.static('public'));
server.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
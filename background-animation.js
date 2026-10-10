// --- FONDO MATEMÁTICO (el mismo que el Multiplicador, con símbolos de redondeo) ---

function setupCanvas() {
    const canvas = document.getElementById('fondoCanvas');
    if (!canvas) return; 
    
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    let elements = [];
    const maxElements = 35;
    let time = 0;
    let mouseX = width / 2;
    let mouseY = height / 2;

    const mathFont = "'Arial', 'Helvetica', sans-serif";

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    class MathElement {
        constructor() {
            this.type = Math.random() > 0.4 ? 'number' : 'symbol';
            
            // Tamaños fijos pero diferentes entre elementos
            this.size = this.type === 'number' ? 
                [28, 32, 36, 40][Math.floor(Math.random() * 4)] : // Tamaños para números
                [30, 34, 38][Math.floor(Math.random() * 3)];     // Tamaños para símbolos
            
            this.reset();
            this.orbitRadius = Math.random() * 80 + 40;
            this.orbitSpeed = (Math.random() - 0.5) * 0.015;
            this.orbitCenterX = Math.random() * width;
            this.orbitCenterY = Math.random() * height;
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            
            // Velocidades fijas
            this.speedX = (Math.random() - 0.5) * 0.6;
            this.speedY = Math.random() * 0.4 + 0.2;
            this.alpha = Math.random() * 0.8 + 0.4;
            this.rotation = (Math.random() - 0.5) * 0.015;
            this.currentRotation = Math.random() * Math.PI * 2;
            
            if (this.type === 'number') {
                this.value = Math.floor(Math.random() * 10);
                this.color = `rgba(180, 220, 255, ${this.alpha})`;
            } else {
                // símbolos de redondeo: aproximado, hacia arriba y hacia abajo
                const symbols = ['≈', '≈', '→', '↑', '↓'];
                this.value = symbols[Math.floor(Math.random() * symbols.length)];
                this.color = `rgba(150, 255, 200, ${this.alpha})`;
            }
        }

        update() {
            // Movimiento de caída con órbita suave
            const orbitAngle = time * this.orbitSpeed;
            this.x = this.orbitCenterX + Math.cos(orbitAngle) * this.orbitRadius;
            this.y += this.speedY;
            
            // Rotación continua pero constante
            this.currentRotation += this.rotation;
            
            // Interacción con el mouse (repulsión suave)
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
                const force = (120 - distance) / 120;
                this.x += (dx / distance) * force * 2;
                this.y += (dy / distance) * force * 2;
            }
            
            // Reset cuando sale de la pantalla
            if (this.y > height + 100) {
                this.y = -50;
                this.x = Math.random() * width;
                this.orbitCenterX = this.x;
                this.orbitCenterY = -50;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.currentRotation);
            
            // Sombra constante (sin ella en modo ligero: el desenfoque es lo que más cuesta)
            ctx.shadowBlur = (document.documentElement.classList.contains('ligero') || document.documentElement.classList.contains('movil')) ? 0 : 15;
            ctx.shadowColor = this.color.replace(')', ', 0.3)');
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            // Tamaño fijo (asignado al crear el elemento)
            ctx.font = `bold ${this.size}px ${mathFont}`;
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.value, 0, 0);
            
            ctx.restore();
        }
    }

    function initElements() {
        elements = [];
        // Crear todos los elementos inmediatamente
        for (let i = 0; i < maxElements; i++) {
            elements.push(new MathElement());
        }
    }

    function drawGrid() {
        // Cuadrícula con efecto de profundidad
        ctx.strokeStyle = 'rgba(80, 140, 200, 0.08)';
        ctx.lineWidth = 1;
        
        const gridSize = 80;
        
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    function drawConnections() {
        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                const e1 = elements[i];
                const e2 = elements[j];
                const dx = e1.x - e2.x;
                const dy = e1.y - e2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const opacity = 1 - distance / 100;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(120, 180, 255, ${opacity * 0.15})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(e1.x, e1.y);
                    ctx.lineTo(e2.x, e2.y);
                    ctx.stroke();
                }
            }
        }
    }

    let salto = 0;
    function animate() {
        // en el móvil se dibuja un fotograma de cada dos (deja libre el hilo para atender los toques)
        if (document.documentElement.classList.contains('movil') && (salto++ & 1)) { requestAnimationFrame(animate); return; }
        time++;
        
        // Gradiente más interesante y dinámico
        const gradient = ctx.createRadialGradient(
            width / 2 + Math.sin(time * 0.001) * 50,
            height / 2 + Math.cos(time * 0.0008) * 30,
            0,
            width / 2,
            height / 2,
            Math.max(width, height) * 0.8
        );
        
        gradient.addColorStop(0, 'rgba(8, 10, 22, 0.85)');
        gradient.addColorStop(0.4, 'rgba(02, 18, 38, 0.87)');
        gradient.addColorStop(0.7, 'rgba(06, 28, 54, 0.89)');
        gradient.addColorStop(1, 'rgba(10, 35, 65, 1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Elementos de dibujo
        drawGrid();
        
        // Actualizar y dibujar elementos
        elements.forEach(e => {
            e.update();
            e.draw();
        });
        
        if (!document.documentElement.classList.contains('movil')) drawConnections();

        requestAnimationFrame(animate);
    }

    // Seguimiento del mouse para interacción
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
        mouseX = width / 2;
        mouseY = height / 2;
    });

    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
    initElements(); // Todos los elementos aparecen inmediatamente
    animate();
}
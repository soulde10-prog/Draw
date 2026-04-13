<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Draw - Roofing & Architecture Tool</title>
    <link rel="stylesheet" href="arch-style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script> <!-- fallback if needed, but we use modules below -->
    <style>
        body { margin:0; font-family: 'Segoe UI', sans-serif; }
        #container { display:flex; flex-direction:column; height:100vh; }
        #toolbar { display:flex; gap:8px; padding:10px; background:#f4f4f4; border-bottom:1px solid #ccc; flex-wrap:wrap; align-items:center; }
        #toolbar select, #toolbar button, #toolbar input { padding:6px 10px; font-size:14px; }
        #canvasContainer { flex:1; position:relative; background:#fafafa; }
        canvas { display:block; }
        .tab { padding:8px 16px; cursor:pointer; background:#eee; border:1px solid #ccc; }
        .tab.active { background:#fff; border-bottom:2px solid #007acc; }
    </style>
</head>
<body>
    <div id="container">
        <!-- Toolbar -->
        <div id="toolbar"></div>

        <!-- Tabs -->
        <div style="display:flex; background:#f1f1f1; border-bottom:1px solid #ccc;">
            <div class="tab active" onclick="switchTab(0)">2D Floor Plan</div>
            <div class="tab" onclick="switchTab(1)">Roofing Tools</div>
            <div class="tab" onclick="switchTab(2)">3D Roof Viewer</div>
            <div class="tab" onclick="switchTab(3)">Calculations</div>
        </div>

        <!-- Canvas Container -->
        <div id="canvasContainer">
            <canvas id="archCanvas" width="1200" height="700"></canvas>
        </div>

        <!-- 3D Container (hidden by default) -->
        <div id="threeContainer" style="display:none; flex:1; position:relative;">
            <div id="threeRenderer"></div>
        </div>
    </div>

    <script type="module">
        // ====================== 2D ARCH ENGINE (Fixed & Cleaned) ======================
        const GRID_SIZE = 25;
        let zoom = 1;
        let pan = { x: 0, y: 0 };
        let canvas, ctx;
        let tool = "line";
        let strokeColor = "#000000";
        let start = { x: 0, y: 0 };
        let current = { x: 0, y: 0 };
        let isDrawing = false;
        let undoStack = [];
        let redoStack = [];
        let activeSymbol = null;
        let symbols = [
            { id: "chair", icon: "🪑" },
            { id: "bed", icon: "🛏️" },
            { id: "window", icon: "🪟" },
            { id: "door", icon: "🚪" },
            { id: "box", icon: "📦" }
        ];
        let currentRoom = [];

        // Persistent scene
        const layers = { walls: 0, openings: 1, dimensions: 2, symbols: 3, rooms: 4 };
        let scene = { [layers.walls]: [], [layers.openings]: [], [layers.dimensions]: [], [layers.symbols]: [], [layers.rooms]: [] };

        // ====================== INITIALIZATION ======================
        function init2D() {
            canvas = document.getElementById("archCanvas");
            ctx = canvas.getContext("2d");
            buildToolbar();
            bindEvents();
            redraw();
            console.log("%c2D Architecture Engine v1.5+ (fixed) loaded", "color:#2ecc71; font-weight:bold");
        }

        function buildToolbar() {
            const bar = document.getElementById("toolbar");
            bar.innerHTML = `
                <select id="toolSelect">
                    <option value="line">Wall</option>
                    <option value="door">Door</option>
                    <option value="window">Window</option>
                    <option value="dimension">Dimension</option>
                    <option value="room">Room Area</option>
                    <option value="symbol">Symbol</option>
                    <option value="pencil">Freehand</option>
                    <option value="pan">Pan</option>
                </select>
                <select id="symbolSelect">
                    ${symbols.map(s => `<option value="${s.id}">${s.icon}</option>`).join("")}
                </select>
                <input type="color" id="colorPick" value="#000000">
                <button id="undoBtn">Undo</button>
                <button id="redoBtn">Redo</button>
                <button id="clearBtn">Clear</button>
                <button id="saveBtn">Save to Zoho</button>
                <button onclick="exportSceneJSON()">Export JSON</button>
            `;

            document.getElementById("toolSelect").onchange = e => tool = e.target.value;
            document.getElementById("symbolSelect").onchange = e => { activeSymbol = symbols.find(s => s.id === e.target.value); };
            document.getElementById("colorPick").onchange = e => strokeColor = e.target.value;
            document.getElementById("undoBtn").onclick = undo;
            document.getElementById("redoBtn").onclick = redo;
            document.getElementById("clearBtn").onclick = clearCanvas;
            document.getElementById("saveBtn").onclick = saveToZoho;
        }

        // ====================== EVENTS ======================
        function bindEvents() {
            canvas.addEventListener("mousedown", onPointerDown);
            canvas.addEventListener("mousemove", onPointerMove);
            canvas.addEventListener("mouseup", onPointerUp);
            canvas.addEventListener("mouseleave", onPointerUp);

            // Touch support
            canvas.addEventListener("touchstart", e => onPointerDown(e.touches[0]));
            canvas.addEventListener("touchmove", e => onPointerMove(e.touches[0]));
            canvas.addEventListener("touchend", onPointerUp);

            canvas.addEventListener("wheel", onZoom);
        }

        function getCanvasPos(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left - pan.x) / zoom,
                y: (e.clientY - rect.top - pan.y) / zoom
            };
        }

        function onPointerDown(e) {
            isDrawing = true;
            start = snapPoint(getCanvasPos(e));
            if (tool === "room") currentRoom.push(start);
            saveState();
        }

        function onPointerMove(e) {
            if (!isDrawing) return;
            current = snapPoint(getCanvasPos(e));

            // Live preview
            ctx.putImageData(undoStack[undoStack.length - 1] || ctx.getImageData(0,0,canvas.width,canvas.height), 0, 0);

            ctx.save();
            ctx.translate(pan.x, pan.y);
            ctx.scale(zoom, zoom);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2 / zoom;

            switch (tool) {
                case "line": liveWall(start, current); break;
                case "door": liveDoor(start, current); break;
                case "window": liveWindow(start, current); break;
                case "dimension": liveDimension(start, current); break;
                case "symbol": liveSymbol(current); break;
                case "room": liveRoomPreview(current); break;
                case "pencil": liveFreehand(); break;
                case "pan":
                    pan.x += e.movementX || (e.touches ? e.touches[0].movementX : 0);
                    pan.y += e.movementY || (e.touches ? e.touches[0].movementY : 0);
                    redraw();
                    break;
            }
            ctx.restore();
        }

        function onPointerUp() {
            if (!isDrawing) return;
            isDrawing = false;

            const end = snapSmart(current, start);

            switch (tool) {
                case "line": commitWall(start, end); break;
                case "door": commitDoor(start, end); break;
                case "window": commitWindow(start, end); break;
                case "dimension": commitDimension(start, end); break;
                case "symbol": commitSymbol(end); break;
                case "room": commitRoomPoint(end); break;
            }
            redraw();
        }

        function onZoom(e) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            const newZoom = Math.min(3, Math.max(0.3, zoom + delta));
            const mouse = getCanvasPos(e);
            pan.x -= (mouse.x * newZoom - mouse.x * zoom);
            pan.y -= (mouse.y * newZoom - mouse.y * zoom);
            zoom = newZoom;
            redraw();
        }

        // ====================== DRAWING HELPERS ======================
        function snapPoint(pt) {
            return { x: Math.round(pt.x / GRID_SIZE) * GRID_SIZE, y: Math.round(pt.y / GRID_SIZE) * GRID_SIZE };
        }

        function snapSmart(pt, origin = null) {
            let snapped = snapPoint(pt);
            if (!origin) return snapped;
            const dx = snapped.x - origin.x;
            const dy = snapped.y - origin.y;
            const deg = Math.atan2(dy, dx) * 180 / Math.PI;
            let snappedDeg = deg;
            if (Math.abs(deg) < 15) snappedDeg = 0;
            else if (Math.abs(deg - 90) < 15 || Math.abs(deg + 90) < 15) snappedDeg = 90 * Math.sign(deg);
            else if (Math.abs(deg - 45) < 15) snappedDeg = 45;
            else if (Math.abs(deg + 45) < 15) snappedDeg = -45;
            const len = Math.hypot(dx, dy);
            const rad = snappedDeg * Math.PI / 180;
            return { x: origin.x + Math.cos(rad) * len, y: origin.y + Math.sin(rad) * len };
        }

        function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
        function midPoint(a, b) { return { x: (a.x + b.x)/2, y: (a.y + b.y)/2 }; }

        function liveWall(a, b) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            const m = (dist(a,b)/GRID_SIZE).toFixed(2);
            const mid = midPoint(a,b);
            ctx.fillStyle = strokeColor; ctx.font = `${14/zoom}px Segoe UI`;
            ctx.fillText(`${m}m`, mid.x+5, mid.y-5);
        }

        function liveDoor(a, b) {
            const r = dist(a,b);
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
            ctx.arc(a.x, a.y, r, 0, Math.PI/2); ctx.stroke();
        }

        function liveWindow(a, b) {
            const th = GRID_SIZE * 0.3;
            ctx.beginPath(); ctx.rect(a.x, a.y - th/2, b.x - a.x, th);
            ctx.fillStyle = "white"; ctx.fill(); ctx.stroke();
        }

        function liveDimension(a, b) {
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
            drawArrowhead(a,b); drawArrowhead(b,a);
            const m = (dist(a,b)/GRID_SIZE).toFixed(2);
            const mid = midPoint(a,b);
            ctx.fillStyle = strokeColor; ctx.font = `${14/zoom}px Segoe UI`;
            ctx.fillText(`${m}m`, mid.x+5, mid.y-5);
        }

        function drawArrowhead(from, to) {
            const ang = Math.atan2(to.y-from.y, to.x-from.x);
            const sz = 10/zoom;
            ctx.beginPath();
            ctx.moveTo(to.x, to.y);
            ctx.lineTo(to.x - sz*Math.cos(ang-Math.PI/6), to.y - sz*Math.sin(ang-Math.PI/6));
            ctx.lineTo(to.x - sz*Math.cos(ang+Math.PI/6), to.y - sz*Math.sin(ang+Math.PI/6));
            ctx.closePath(); ctx.fillStyle = strokeColor; ctx.fill();
        }

        function liveSymbol(pt) {
            if (!activeSymbol) return;
            ctx.fillStyle = strokeColor; ctx.font = `${26/zoom}px Segoe UI`;
            ctx.fillText(activeSymbol.icon, pt.x-10, pt.y+10);
        }

        function liveFreehand() {
            ctx.lineTo(current.x, current.y); ctx.stroke();
        }

        function liveRoomPreview(pt) {
            const pts = [...currentRoom, pt];
            ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
            pts.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
            if (pts.length >= 3) {
                const area = calculatePolygonArea(pts).toFixed(2);
                ctx.fillStyle = "green"; ctx.font = `${16/zoom}px Segoe UI`;
                ctx.fillText(`${area} m²`, pt.x+10, pt.y+10);
            }
        }

        function calculatePolygonArea(pts) {
            let sum = 0;
            for (let i = 0; i < pts.length; i++) {
                const j = (i+1) % pts.length;
                sum += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
            }
            return Math.abs(sum / 2) / (GRID_SIZE * GRID_SIZE);
        }

        // ====================== COMMIT & RENDER ======================
        function commitWall(a,b) { scene[layers.walls].push({type:"wall", a:{...a}, b:{...b}, color:strokeColor}); }
        function commitDoor(a,b) { scene[layers.openings].push({type:"door", a:{...a}, b:{...b}, color:strokeColor}); }
        function commitWindow(a,b) { scene[layers.openings].push({type:"window", a:{...a}, b:{...b}, color:strokeColor}); }
        function commitDimension(a,b) { scene[layers.dimensions].push({type:"dimension", a:{...a}, b:{...b}, color:strokeColor}); }
        function commitSymbol(pos) {
            if (!activeSymbol) return;
            scene[layers.symbols].push({type:"symbol", icon:activeSymbol.icon, x:pos.x, y:pos.y, size:28, color:strokeColor});
        }
        function commitRoomPoint(pt) {
            currentRoom.push(pt);
            if (currentRoom.length >= 3) {
                const first = currentRoom[0];
                if (Math.hypot(pt.x - first.x, pt.y - first.y) < GRID_SIZE * 1.2) finalizeRoom();
            }
        }
        function finalizeRoom() {
            const points = [...currentRoom];
            currentRoom.length = 0;
            const area = calculatePolygonArea(points);
            const cx = points.reduce((s,p)=>s+p.x,0)/points.length;
            const cy = points.reduce((s,p)=>s+p.y,0)/points.length;
            scene[layers.rooms].push({type:"room", points, area, label:{x:cx,y:cy}, color:"green"});
        }

        function redraw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(pan.x, pan.y);
            ctx.scale(zoom, zoom);

            // Grid
            ctx.strokeStyle = "#e8e8e8"; ctx.lineWidth = 1;
            const size = GRID_SIZE * zoom;
            for (let x = (pan.x % size); x < canvas.width; x += size) {
                ctx.beginPath(); ctx.moveTo((x - pan.x)/zoom, 0); ctx.lineTo((x - pan.x)/zoom, canvas.height); ctx.stroke();
            }
            for (let y = (pan.y % size); y < canvas.height; y += size) {
                ctx.beginPath(); ctx.moveTo(0, (y - pan.y)/zoom); ctx.lineTo(canvas.width, (y - pan.y)/zoom); ctx.stroke();
            }

            // Layers
            scene[layers.walls].forEach(o => drawWall(o));
            scene[layers.openings].forEach(o => o.type==="door" ? drawDoor(o) : drawWindow(o));
            scene[layers.dimensions].forEach(o => drawDimension(o));
            scene[layers.symbols].forEach(o => drawStoredSymbol(o));
            scene[layers.rooms].forEach(o => drawStoredRoom(o));

            ctx.restore();
        }

        function drawWall(o) { ctx.strokeStyle = o.color; ctx.lineWidth = 2/zoom; ctx.beginPath(); ctx.moveTo(o.a.x,o.a.y); ctx.lineTo(o.b.x,o.b.y); ctx.stroke(); }
        function drawDoor(o) { /* similar to live */ ctx.strokeStyle = o.color; /* ... implement full */ }
        function drawWindow(o) { /* similar */ }
        function drawDimension(o) { /* similar to liveDimension */ }
        function drawStoredSymbol(o) {
            ctx.fillStyle = o.color; ctx.font = `${o.size/zoom}px Segoe UI`; ctx.fillText(o.icon, o.x, o.y);
        }
        function drawStoredRoom(r) {
            ctx.strokeStyle = r.color; ctx.beginPath(); ctx.moveTo(r.points[0].x, r.points[0].y);
            r.points.forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.stroke();
            ctx.fillStyle = r.color; ctx.font = `${16/zoom}px Segoe UI`;
            ctx.fillText(`${r.area.toFixed(2)} m²`, r.label.x, r.label.y);
        }

        // ====================== UNDO / REDO ======================
        function saveState() {
            try { undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height)); redoStack.length = 0; } catch(e){}
        }
        function undo() {
            if (!undoStack.length) return;
            redoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
            ctx.putImageData(undoStack.pop(), 0, 0);
            redraw();
        }
        function redo() {
            if (!redoStack.length) return;
            undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
            ctx.putImageData(redoStack.pop(), 0, 0);
            redraw();
        }

        function clearCanvas() {
            saveState();
            Object.keys(scene).forEach(k => scene[k] = []);
            currentRoom = [];
            redraw();
        }

        function saveToZoho() {
            try {
                const dataURL = canvas.toDataURL("image/png");
                // ZOHO.CREATOR.UTIL.setFieldValue({ fieldApiName: "Drawing_Data", value: dataURL });
                console.log("✅ Canvas saved as PNG (Zoho hook ready)");
                alert("Drawing saved (Zoho integration placeholder)");
            } catch(e) { console.error(e); }
        }

        function exportSceneJSON() {
            const json = JSON.stringify(scene, null, 2);
            const blob = new Blob([json], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "drawing-scene.json"; a.click();
        }

        // ====================== TAB SWITCHING ======================
        let currentTab = 0;
        function switchTab(tab) {
            document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', i===tab));
            document.getElementById("canvasContainer").style.display = tab === 0 ? "block" : "none";
            document.getElementById("threeContainer").style.display = tab === 2 ? "block" : "none";
            if (tab === 2) init3D(); // lazy init
        }

        // ====================== MODERNISED 3D ROOFING ENGINE ======================
        let threeScene, threeCamera, threeRenderer, threeControls;
        let roofMeshes = [];

        async function init3D() {
            const container = document.getElementById("threeContainer");
            if (threeRenderer) return; // already initialised

            const { Scene, PerspectiveCamera, WebGLRenderer, Mesh, MeshStandardMaterial, DirectionalLight, AmbientLight, BoxGeometry, ConeGeometry } = await import('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js'); // or use local three.module.js

            // Note: For full modern Three.js (r182+), use importmap or local files with:
            // import * as THREE from './three.module.js';
            // import { OrbitControls } from './OrbitControls.js';

            threeScene = new Scene();
            threeCamera = new PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
            threeRenderer = new WebGLRenderer({ antialias: true });
            threeRenderer.setSize(container.clientWidth, container.clientHeight);
            container.innerHTML = '';
            container.appendChild(threeRenderer.domElement);

            // Lights
            const ambient = new AmbientLight(0xffffff, 0.6);
            threeScene.add(ambient);
            const dirLight = new DirectionalLight(0xffffff, 0.8);
            dirLight.position.set(10, 20, 10);
            threeScene.add(dirLight);

            threeCamera.position.set(0, 15, 30);
            threeCamera.lookAt(0,0,0);

            // Simple example roofs (replace with data from 2D scene later)
            createExampleRoofs();

            // Animation loop
            function animate() {
                requestAnimationFrame(animate);
                threeRenderer.render(threeScene, threeCamera);
            }
            animate();

            // Basic orbit (you can add OrbitControls via CDN or local)
            console.log("%c3D Roofing Viewer initialised (modernised)", "color:#3498db");
        }

        function createExampleRoofs() {
            // Gable
            const gableMat = new MeshStandardMaterial({ color: 0x8B4513 });
            const gableBase = new Mesh(new BoxGeometry(20, 0.5, 15), gableMat);
            threeScene.add(gableBase);
            const gableRoof = new Mesh(new ConeGeometry(10, 8, 4), gableMat); // rough gable
            gableRoof.rotation.y = Math.PI/4;
            gableRoof.position.y = 4;
            threeScene.add(gableRoof);

            // Flat
            const flatMat = new MeshStandardMaterial({ color: 0x555555 });
            const flat = new Mesh(new BoxGeometry(18, 0.3, 12), flatMat);
            flat.position.set(25, 2, 0);
            threeScene.add(flat);

            // Add more (hip, mansard) as needed
        }

        // Auto-init 2D on load
        window.onload = () => {
            init2D();
        };
    </script>
</body>
</html>

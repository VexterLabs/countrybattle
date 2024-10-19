// script.js
document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map', {
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a contributors'
    }).addTo(map);

    // Crear bolas y armas
    var bolaUSA = crearBola([37.7749, -122.4194], 'bola-usa', 'Estados Unidos');
    var bolaCanada = crearBola([56.1304, -106.3468], 'bola-canada', 'Canadá');
    var bazucaUSA = crearArma([37.7749, -122.4194], 'bazuca');
    var bazucaCanada = crearArma([56.1304, -106.3468], 'bazuca');

    var puntajeUSA = 0;
    var puntajeCanada = 0;
    var keys = {};
    var velocidad = 0.5;
    const marcador = document.getElementById('marcador');

    document.addEventListener('keydown', function(e) {
        keys[e.key] = true;
    });

    document.addEventListener('keyup', function(e) {
        keys[e.key] = false;
    });

    function crearBola(latlng, className, popupText) {
        return L.marker(latlng, {
            icon: L.divIcon({
                className: 'bola-pais ' + className,
                iconSize: [50, 50]
            })
        }).addTo(map).bindPopup(popupText);
    }

    function crearArma(latlng, className) {
        return L.marker(latlng, {
            icon: L.divIcon({
                className: 'arma ' + className,
                iconSize: [20, 20]
            })
        }).addTo(map);
    }

    function moverBola(bola, bazuca, lat, lng) {
        var newLat = lat;
        var newLng = lng;
        if (keys['w']) newLat += velocidad;
        if (keys['a']) newLng -= velocidad;
        if (keys['s']) newLat -= velocidad;
        if (keys['d']) newLng += velocidad;
        var bounds = map.getBounds();
        if (!bounds.contains([newLat, newLng])) {
            return;
        }
        bola.setLatLng([newLat, newLng]);
        bazuca.setLatLng([newLat, newLng]);
    }

    function moverBolaContraria(bola, bazuca) {
        var lat = bola.getLatLng().lat;
        var lng = bola.getLatLng().lng;
        var direction = Math.random() * 360;
        var distance = velocidad;
        lat += distance * Math.cos(direction);
        lng += distance * Math.sin(direction);
        var bounds = map.getBounds();
        if (!bounds.contains([lat, lng])) {
            return;
        }
        bola.setLatLng([lat, lng]);
        bazuca.setLatLng([lat, lng]);
    }

    function actualizarMarcador() {
        marcador.textContent = `USA: ${puntajeUSA} | Canadá: ${puntajeCanada}`;
    }

    function gameLoop() {
        moverBola(bolaUSA, bazucaUSA, bolaUSA.getLatLng().lat, bolaUSA.getLatLng().lng);
        moverBolaContraria(bolaCanada, bazucaCanada);
        requestAnimationFrame(gameLoop);
    }

    gameLoop();

    function lanzarBomba(bola, target, offsetLat = 0, offsetLng = 0) {
        var bombLatLng = [target.getLatLng().lat + offsetLat, target.getLatLng().lng + offsetLng];
        var bomba = L.circleMarker(bombLatLng, {
            color: 'black',
            fillColor: 'black',
            fillOpacity: 1,
            radius: 5
        }).addTo(map).bindPopup('¡Bomba!');
        setTimeout(() => {
            map.removeLayer(bomba);
            var polygon = L.polygon([
                [bombLatLng[0] + 0.5, bombLatLng[1] - 0.5],
                [bombLatLng[0] - 0.5, bombLatLng[1] - 0.5],
                [bombLatLng[0] - 0.5, bombLatLng[1] + 0.5],
                [bombLatLng[0] + 0.5, bombLatLng[1] + 0.5]
            ], { color: bola.options.icon.options.className.includes('usa') ? 'blue' : 'red' }).addTo(map);
            if (bola === bolaUSA) {
                puntajeUSA++;
            } else {
                puntajeCanada++;
                if (target === bolaUSA) {
                    alert("¡La bola de Canadá ha bombardeado Estados Unidos! Fin de la partida.");
                    location.reload(); // Reinicia el juego
                }
            }
            actualizarMarcador();
        }, 2000);
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'f') {
            lanzarBomba(bolaUSA, bolaCanada);
            lanzarBomba(bolaUSA, bolaCanada, 0.5, 0.5); // Segunda bomba en una ubicación cercana
        }
    });

    function bolaCanadaAtaca() {
        lanzarBomba(bolaCanada, bolaUSA);
    }

    setInterval(bolaCanadaAtaca, 5000);
});

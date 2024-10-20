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
    var bombedByUSA = [];
    var bombedByCanada = [];
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

    function moverBola(direction) {
        var lat = bolaUSA.getLatLng().lat;
        var lng = bolaUSA.getLatLng().lng;
        switch(direction) {
            case 'up': lat += velocidad; break;
            case 'left': lng -= velocidad; break;
            case 'down': lat -= velocidad; break;
            case 'right': lng += velocidad; break;
        }
        var bounds = map.getBounds();
        if (!bounds.contains([lat, lng])) {
            return;
        }
        bolaUSA.setLatLng([lat, lng]);
        bazucaUSA.setLatLng([lat, lng]);
        document.getElementById('moveSound').play();
    }

    function moverBolaConTeclado() {
        var lat = bolaUSA.getLatLng().lat;
        var lng = bolaUSA.getLatLng().lng;
        if (keys['w']) lat += velocidad;
        if (keys['a']) lng -= velocidad;
        if (keys['s']) lat -= velocidad;
        if (keys['d']) lng += velocidad;
        var bounds = map.getBounds();
        if (!bounds.contains([lat, lng])) {
            return;
        }
        bolaUSA.setLatLng([lat, lng]);
        bazucaUSA.setLatLng([lat, lng]);
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
        moverBolaConTeclado();
        moverBolaContraria(bolaCanada, bazucaCanada);
        requestAnimationFrame(gameLoop);
    }

    gameLoop();

    function lanzarBomba() {
        lanzarBombaDesde(bolaUSA, bolaCanada);
        lanzarBombaDesde(bolaUSA, bolaCanada, 0.5, 0.5); // Segunda bomba en una ubicación cercana
    }

    function lanzarBombaDesde(bola, target, offsetLat = 0, offsetLng = 0) {
        var bombLatLng = [target.getLatLng().lat + offsetLat, target.getLatLng().lng + offsetLng];
        var bomba = L.circleMarker(bombLatLng, {
            color: 'black',
            fillColor: 'black',
            fillOpacity: 1,
            radius: 5
        }).addTo(map).bindPopup('¡Bomba!');
        document.getElementById('explosionSound').play();
        setTimeout(() => {
            map.removeLayer(bomba);
            var polygon = L.polygon([
                [bombLatLng[0] + 0.5, bombLatLng[1] - 0.5],
                [bombLatLng[0] - 0.5, bombLatLng[1] - 0.5],
                [bombLatLng[0] - 0.5, bombLatLng[1] + 0.5],
                [bombLatLng[0] + 0.5, bombLatLng[1] + 0.5]
            ], { color: bola.options.icon.options.className.includes('usa') ? 'blue' : 'red' }).addTo(map);
            if (bola.options.icon.options.className.includes('usa')) {
                puntajeUSA++;
                bombedByUSA.push(target.getPopup().getContent());
            } else {
                puntajeCanada++;
                bombedByCanada.push(target.getPopup().getContent());
                if (target === bolaUSA) {
                    //alert("¡La bola de Canadá ha bombardeado Estados Unidos! Fin de la partida.");
                    mostrarEstadisticas();
                }
            }
            actualizarMarcador();
            checarGanador();
        }, 2000);
    }

    function mostrarEstadisticas() {
        var estadisticasDiv = document.getElementById('estadisticas');
        var bombedByUSAList = document.getElementById('bombedByUSA');
        var bombedByCanadaList = document.getElementById('bombedByCanada');

        bombedByUSAList.innerHTML = bombedByUSA.map(pais => `<li>${pais}</li>`).join('');
        bombedByCanadaList.innerHTML = bombedByCanada.map(pais => `<li>${pais}</li>`).join('');
        
        estadisticasDiv.classList.remove('hidden');
    }

    function checarGanador() {
        var totalPaises = 2; // Ajusta según el número de países en tu juego
        if (bombedByUSA.length >= totalPaises) {
            //alert("¡USA ha bombardeado todos los países y gana la partida!");
            mostrarEstadisticas();
        } else if (bombedByCanada.length >= totalPaises) {
            //alert("¡Canadá ha bombardeado todos los países y gana la partida!");
            mostrarEstadisticas();
        }
    }

    function reiniciarJuego() {
        location.reload();
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'f') {
            lanzarBomba();
        }
    });

    document.getElementById('upButton').addEventListener('click', function() {
        moverBola('up');
    });
    document.getElementById('leftButton').addEventListener('click', function() {
        moverBola('left');
    });
    document.getElementById('downButton').addEventListener('click', function() {
        moverBola('down');
    });
    document.getElementById('rightButton').addEventListener('click', function() {
        moverBola('right');
    });
    document.getElementById('fireButton').addEventListener('click', function() {
        lanzarBomba();
    });

    function bolaCanadaAtaca() {
        lanzarBombaDesde(bolaCanada, bolaUSA);
    }

    setInterval(bolaCanadaAtaca, 5000);
});

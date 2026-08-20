const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

const markersContainer = document.getElementById("markers");

const revealSize = document.getElementById("reveal-size");
const revealSizeValue = document.getElementById("reveal-size-value");

const markerModeButton = document.getElementById("marker-mode");
const saveButton = document.getElementById("save-button");
const resetButton = document.getElementById("reset-button");

const mapImage = new Image();

mapImage.src = "assets/map.png";

/*
    --------------------------------------------------
    VARIABLES
    --------------------------------------------------
*/

let mouseX = -1000;
let mouseY = -1000;

let revealRadius = 75;

let markerMode = false;

let markers = [];

let isMouseDown = false;


/*
    --------------------------------------------------
    CANVAS DE RÉVÉLATION
    --------------------------------------------------

    Ce canvas contient uniquement le brouillard.

    Noir = zone cachée
    Transparent = zone découverte
*/

const revealCanvas = document.createElement("canvas");

const revealCtx = revealCanvas.getContext("2d");

const toggleControls =
    document.getElementById("toggle-controls");

const controls =
    document.getElementById("controls");

/*
    --------------------------------------------------
    CONTROLE TOGGLE
    --------------------------------------------------
*/

toggleControls.addEventListener(
    "click",
    () => {

        controls.classList.toggle("collapsed");

        if (controls.classList.contains("collapsed")) {

            toggleControls.textContent = "☰";
            toggleControls.title = "Afficher les contrôles";

        } else {

            toggleControls.textContent = "×";
            toggleControls.title = "Masquer les contrôles";
        }
    }
);


/*
    --------------------------------------------------
    INITIALISATION
    --------------------------------------------------
*/

mapImage.onload = () => {

    revealCanvas.width = mapImage.width;
    revealCanvas.height = mapImage.height;

    loadProgress();

    resizeCanvas();

    renderMarkers();
};


/*
    --------------------------------------------------
    REDIMENSIONNEMENT
    --------------------------------------------------
*/

function resizeCanvas(){

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    draw();
}


/*
    --------------------------------------------------
    POSITION DE LA CARTE
    --------------------------------------------------
*/

function getMapDimensions(){

    const scale = Math.min(
        canvas.width / mapImage.width,
        canvas.height / mapImage.height
    );

    const width = mapImage.width * scale;
    const height = mapImage.height * scale;

    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;

    return {
        x,
        y,
        width,
        height,
        scale
    };
}


/*
    --------------------------------------------------
    RÉVÉLER UNE ZONE
    --------------------------------------------------
*/

function revealAt(screenX, screenY){

    const map = getMapDimensions();

    /*
        Vérifier que la souris est bien
        au-dessus de la carte
    */

    if (
        screenX < map.x ||
        screenX > map.x + map.width ||
        screenY < map.y ||
        screenY > map.y + map.height
    ){

        return;
    }


    /*
        Convertir les coordonnées écran
        en coordonnées de l'image originale
    */

    const imageX =
        (screenX - map.x) / map.scale;

    const imageY =
        (screenY - map.y) / map.scale;


    /*
        Convertir le rayon écran
        en rayon dans l'image
    */

    const radius =
        revealRadius / map.scale;


    /*
        On efface le brouillard
    */

    revealCtx.save();

    revealCtx.globalCompositeOperation =
        "destination-out";


    /*
        Petit dégradé pour avoir
        un bord plus joli
    */

    const gradient =
        revealCtx.createRadialGradient(
            imageX,
            imageY,
            radius * 0.65,
            imageX,
            imageY,
            radius
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,1)"
    );

    gradient.addColorStop(
        0.75,
        "rgba(0,0,0,0.9)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );


    revealCtx.fillStyle = gradient;

    revealCtx.beginPath();

    revealCtx.arc(
        imageX,
        imageY,
        radius,
        0,
        Math.PI * 2
    );

    revealCtx.fill();

    revealCtx.restore();


    draw();
}


/*
    --------------------------------------------------
    DESSIN
    --------------------------------------------------
*/

function draw(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    const map = getMapDimensions();


    /*
        Fond noir
    */

    ctx.fillStyle = "#000";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
        Dessiner la carte
    */

    ctx.drawImage(
        mapImage,
        map.x,
        map.y,
        map.width,
        map.height
    );


    /*
        Dessiner le brouillard
    */

    ctx.drawImage(
        revealCanvas,
        map.x,
        map.y,
        map.width,
        map.height
    );
}


/*
    --------------------------------------------------
    SOURIS
    --------------------------------------------------
*/


canvas.addEventListener(
    "mousemove",
    event => {

        mouseX = event.clientX;
        mouseY = event.clientY;

        // Révéler uniquement si le clic gauche est maintenu
        if (isMouseDown && !markerMode) {

            revealAt(
                mouseX,
                mouseY
            );
        }
    }
);

canvas.addEventListener(
    "mousedown",
    event => {

        // Uniquement avec le clic gauche
        if (event.button !== 0) {
            return;
        }

        isMouseDown = true;

        // En mode normal, le clic commence immédiatement
        // à révéler la carte
        if (!markerMode) {

            revealAt(
                event.clientX,
                event.clientY
            );
        }
    }
);

canvas.addEventListener(
    "mouseup",
    event => {

        if (event.button !== 0) {
            return;
        }

        isMouseDown = false;
    }
);

window.addEventListener(
    "mouseup",
    () => {

        isMouseDown = false;
    }
);


/*
    --------------------------------------------------
    TAILLE DU CURSEUR
    --------------------------------------------------
*/

revealSize.addEventListener(
    "input",
    () => {

        revealRadius =
            Number(revealSize.value);

        revealSizeValue.textContent =
            `${revealRadius} px`;
    }
);


/*
    --------------------------------------------------
    MODE MARQUEUR
    --------------------------------------------------
*/

markerModeButton.addEventListener(
    "click",
    () => {

        markerMode = !markerMode;

        markerModeButton.classList.toggle(
            "active",
            markerMode
        );


        if (markerMode){

            markerModeButton.textContent =
                "📍 Mode marqueur activé";

            canvas.style.cursor =
                "crosshair";

        } else {

            markerModeButton.textContent =
                "📍 Ajouter un marqueur";

            canvas.style.cursor =
                "crosshair";
        }
    }
);


/*
    --------------------------------------------------
    CRÉER UN MARQUEUR
    --------------------------------------------------
*/

function createMarker(screenX, screenY){

    const map = getMapDimensions();


    /*
        Vérifier qu'on clique
        bien sur la carte
    */

    if (
        screenX < map.x ||
        screenX > map.x + map.width ||
        screenY < map.y ||
        screenY > map.y + map.height
    ){

        return;
    }


    /*
        Coordonnées relatives
        à l'image originale
    */

    const x =
        (screenX - map.x) / map.width;

    const y =
        (screenY - map.y) / map.height;


    const marker = {

        id: Date.now(),

        x: x,

        y: y
    };


    markers.push(marker);

    renderMarkers();

    saveProgress();
}


/*
    --------------------------------------------------
    AFFICHER LES MARQUEURS
    --------------------------------------------------
*/

function renderMarkers(){

    markersContainer.innerHTML = "";


    const map = getMapDimensions();


    markers.forEach(marker => {

        const element =
            document.createElement("div");


        element.className =
            "marker";


        element.textContent =
            "📍";


        /*
            Position en fonction
            de la carte
        */

        element.style.left =
            `${map.x + marker.x * map.width}px`;

        element.style.top =
            `${map.y + marker.y * map.height}px`;


        /*
            Clic droit = supprimer
        */

        element.addEventListener(
            "contextmenu",
            event => {

                event.preventDefault();

                deleteMarker(marker.id);
            }
        );


        /*
            Double clic = supprimer
        */

        element.addEventListener(
            "dblclick",
            () => {

                deleteMarker(marker.id);
            }
        );


        markersContainer.appendChild(
            element
        );
    });
}


/*
    --------------------------------------------------
    SUPPRIMER UN MARQUEUR
    --------------------------------------------------
*/

function deleteMarker(id){

    markers =
        markers.filter(
            marker => marker.id !== id
        );

    renderMarkers();

    saveProgress();
}


/*
    --------------------------------------------------
    SAUVEGARDE
    --------------------------------------------------
*/

function saveProgress(){

    /*
        Convertir le brouillard
        en image PNG
    */

    const revealData =
        revealCanvas.toDataURL("image/png");


    const data = {

        reveal: revealData,

        markers: markers
    };


    localStorage.setItem(
        "silksong-map-progress",
        JSON.stringify(data)
    );
}


/*
    --------------------------------------------------
    CHARGEMENT DE LA SAUVEGARDE
    --------------------------------------------------
*/

function loadProgress(){

    const saved =
        localStorage.getItem(
            "silksong-map-progress"
        );


    /*
        Aucune sauvegarde
    */

    if (!saved){

        createEmptyFog();

        return;
    }


    try {

        const data =
            JSON.parse(saved);


        /*
            Charger les marqueurs
        */

        markers =
            data.markers || [];


        /*
            Charger le brouillard
        */

        if (data.reveal){

            const savedImage =
                new Image();


            savedImage.onload = () => {

                revealCtx.clearRect(
                    0,
                    0,
                    revealCanvas.width,
                    revealCanvas.height
                );


                revealCtx.drawImage(
                    savedImage,
                    0,
                    0
                );


                draw();

                renderMarkers();
            };


            savedImage.src =
                data.reveal;

        } else {

            createEmptyFog();
        }

    } catch (error){

        console.error(
            "Impossible de charger la sauvegarde.",
            error
        );

        createEmptyFog();
    }
}


/*
    --------------------------------------------------
    CRÉER UN BROUILLARD INITIAL
    --------------------------------------------------
*/

function createEmptyFog(){

    revealCtx.clearRect(
        0,
        0,
        revealCanvas.width,
        revealCanvas.height
    );


    revealCtx.globalCompositeOperation =
        "source-over";


    revealCtx.fillStyle =
        "#000";


    revealCtx.fillRect(
        0,
        0,
        revealCanvas.width,
        revealCanvas.height
    );


    draw();
}


/*
    --------------------------------------------------
    BOUTON SAUVEGARDE
    --------------------------------------------------
*/

saveButton.addEventListener(
    "click",
    () => {

        saveProgress();

        saveButton.textContent =
            "✓ Sauvegardé !";


        setTimeout(
            () => {

                saveButton.textContent =
                    "💾 Sauvegarder";

            },
            1500
        );
    }
);


/*
    --------------------------------------------------
    RÉINITIALISER
    --------------------------------------------------
*/

resetButton.addEventListener(
    "click",
    () => {

        const confirmation =
            confirm(
                "Voulez-vous vraiment effacer toute votre progression ?"
            );


        if (!confirmation){

            return;
        }


        localStorage.removeItem(
            "silksong-map-progress"
        );


        markers = [];


        createEmptyFog();

        renderMarkers();
    }
);


/*
    --------------------------------------------------
    REDIMENSIONNEMENT
    --------------------------------------------------
*/

window.addEventListener(
    "resize",
    () => {

        resizeCanvas();

        renderMarkers();
    }
);
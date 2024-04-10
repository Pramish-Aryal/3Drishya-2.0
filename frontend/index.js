function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        let position = section.getBoundingClientRect();
        window.scrollTo(position.left, position.top + window.scrollY - 90);

    }
}

function gotoviewer(path) {
    window.location.href = path;
}

function showSaveNameOption() {
    const saveNameOption = document.getElementById('saveNameOption');
    saveNameOption.style.display = 'flex'; // Adjust the display style as needed
}

function cancelSave() {
    const saveNameOption = document.getElementById('saveNameOption');
    saveNameOption.style.display = 'none';
    // Optionally, you can clear the input field if needed
    document.getElementById('sceneNameInput').value = '';
}

// Function to save the scene name and navigate
function saveAndNavigate() {
    const sceneNameInput = document.getElementById('sceneNameInput');
    const sceneName = sceneNameInput.value;

    // Check if a name is entered
    if (sceneName.trim() !== '') {
        // Construct the URL and navigate
        const url = `src/editor.html?scene=${sceneName}&newscene=true`;
        gotoviewer(url);
    } else {
        // Handle case where no name is entered (show an error, prompt, etc.)
        alert('Please enter a scene name.');
    }
}


document.addEventListener('DOMContentLoaded', function() {
    // Load files from /queryFiles endpoint
    fetch('http://localhost:3000/queryFiles')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Handle the files as needed
            const sceneContainer = document.getElementById('sceneContainer');
            const scenes = document.getElementById('scenes');
            const dotsContainer = document.getElementById('dotsContainer');

            const dotSpan = document.createElement('span');
            dotSpan.className = 'dot';
            dotSpan.onclick = function() {
                currentSlide(1);
            };
            dotsContainer.appendChild(dotSpan);

            // Add a new scene and dot for each file
            data.files.forEach((fileName, index) => {
                const sceneName = fileName.replace('.conf', '')
                const sceneDiv = document.createElement('div');
                sceneDiv.className = 'Scene';
                sceneDiv.onclick = function() {
                    gotoviewer(`src/viewer.html?scene=${sceneName}`);
                };

                const sceneInfoDiv = document.createElement('div');
                sceneInfoDiv.className = 'sceneInfo';
                sceneInfoDiv.textContent = sceneName; // Displaying without the file extension

                const img = document.createElement('img');
                img.src = `http://localhost:3000/scene-image/${sceneName}`;
                img.onerror = function() {

                    // Fallback image if the specific scene image doesn't exist or failed to load
                    this.src = 'images/editor/defaultImage.png'; // Set a default or placeholder image path
                };
                img.style.width = '450px';
                img.style.height = '300px';
                img.style.objectFit = 'contain';


                sceneDiv.appendChild(sceneInfoDiv);
                sceneDiv.appendChild(img);
                scenes.appendChild(sceneDiv);

                // Add a new dot for each file
                const dotSpan = document.createElement('span');
                dotSpan.className = 'dot';
                dotSpan.onclick = function() {
                    currentSlide(index + 1);
                };
                dotsContainer.appendChild(dotSpan);
            });
            showSlides(slideIndex);
        })
        .catch(error => {
            console.error('Error:', error);
            // Handle the error, e.g., display an error message on the page
        });

});


let slideIndex = 1;

// Next/previous controls
function plusSlides(n) {
    showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("Scene");
    let dots = document.getElementsByClassName("dot");
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
}
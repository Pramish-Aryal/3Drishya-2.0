function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if(section){
      let position = section.getBoundingClientRect();
      window.scrollTo(position.left, position.top + window.scrollY - 90);

  }
}

function gotoviewer(path){
  window.location.href = path;
}


document.addEventListener('DOMContentLoaded', function () {
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
        dotSpan.onclick = function () {
          currentSlide(1);
        };
        dotsContainer.appendChild(dotSpan);

      // Add a new scene and dot for each file
      data.files.forEach((fileName, index) => {
        const sceneDiv = document.createElement('div');
        sceneDiv.className = 'Scene';
        fileName = fileName.replace('.conf', '')
        sceneDiv.onclick = function () {
          gotoviewer(`src/viewer.html?scene=${fileName}`);
        };

        const sceneInfoDiv = document.createElement('div');
        sceneInfoDiv.className = 'sceneInfo';
        sceneInfoDiv.textContent = fileName; // Displaying without the file extension

        const img = document.createElement('img');
        img.src = `images/editor/${index % 2 === 0 ? 'mesh.png' : 'mesh2.png'}`;
        img.style.width = '50%';

        sceneDiv.appendChild(sceneInfoDiv);
        sceneDiv.appendChild(img);
        scenes.appendChild(sceneDiv);

        // Add a new dot for each file
        const dotSpan = document.createElement('span');
        dotSpan.className = 'dot';
        dotSpan.onclick = function () {
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
    if (n > slides.length) {slideIndex = 1}
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex-1].style.display = "block";
    dots[slideIndex-1].className += " active";
  }






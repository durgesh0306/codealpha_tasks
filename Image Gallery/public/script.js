let allImages = [];
let currentIndex = 0;

fetch('/api/list-all')
  .then(res => res.json())
  .then(data => {
    const gallery = document.getElementById('gallery');
    const filterButtonsDiv = document.querySelector('.filter-buttons');

    // Clear and add filter buttons
    filterButtonsDiv.innerHTML = '<button data-filter="all" class="active">All</button>';
    Object.keys(data).forEach(category => {
      const btn = document.createElement('button');
      btn.dataset.filter = category;
      btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      filterButtonsDiv.appendChild(btn);
    });

    // Add images
    Object.entries(data).forEach(([category, images]) => {
      images.forEach(src => {
        allImages.push({ src, category });
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.dataset.category = category;

        const img = document.createElement('img');
        img.src = src;
        img.alt = "";                  // no visible text if image fails
        img.loading = "lazy";          // better performance

        div.appendChild(img);
        gallery.appendChild(div);
      });
    });

    addLightboxListeners();
    addFilterListeners();
  })
  .catch(err => console.error('Failed to load images:', err));

// Lightbox
function addLightboxListeners() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  document.querySelectorAll('.gallery-item img').forEach((img, index) => {
    img.addEventListener('click', () => {
      lightbox.style.display = "block";
      lightboxImg.src = img.src;
      currentIndex = index;
    });
  });

  document.querySelector('.close').onclick = () => {
    lightbox.style.display = "none";
  };

  document.querySelector('.prev').onclick = () => {
    currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    lightboxImg.src = allImages[currentIndex].src;
  };

  document.querySelector('.next').onclick = () => {
    currentIndex = (currentIndex + 1) % allImages.length;
    lightboxImg.src = allImages[currentIndex].src;
  };
}

// Filters
function addFilterListeners() {
  const filterButtons = document.querySelectorAll('.filter-buttons button');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      document.querySelector('.filter-buttons button.active').classList.remove('active');
      button.classList.add('active');
      const filter = button.getAttribute('data-filter');

      document.querySelectorAll('.gallery-item').forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

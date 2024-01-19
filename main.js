document.addEventListener("DOMContentLoaded", initializePage);

let refreshTimer;
let allowNsfw = false;
let favouriteMemes = JSON.parse(localStorage.getItem("favouriteMemes")) || [];
let lastTenMemes = JSON.parse(localStorage.getItem("lastTenMemes")) || [];

const elements = {
  html: document.querySelector("html"),
  nextBtn: document.getElementById("nextBtn"),
  shareBtn: document.getElementById("shareBtn"),
  likeBtn: document.getElementById("likeBtn"),
  themeBtn: document.getElementById("themeBtn"),
  category: document.getElementById("category"),
  nsfwBox: document.getElementById("nsfwBox"),
  memeImg: document.getElementById("memeImg"),
  timer: document.getElementById("timer"),
  historyShowBtn: document.getElementById("historyShowBtn"),
  favouritesShowBtn: document.getElementById("favouritesShowBtn"),
  historyCloseBtn: document.getElementById("historyCloseBtn"),
  favouritesCloseBtn: document.getElementById("favouritesCloseBtn"),
  historyDialog: document.getElementById("historyDialog"),
  favouriteDialog: document.getElementById("favouriteDialog"),
  historyContent: document.getElementById("historyContent"),
  favouritesContent: document.getElementById("favouritesContent"),
  snackbar: document.getElementById("snackbar")
};

function initializePage() {
  elements.nextBtn.addEventListener("click", fetchMeme);
  elements.shareBtn.addEventListener("click", () => shareMeme(elements.memeImg.src));
  elements.category.addEventListener("change", fetchMeme);
  elements.nsfwBox.addEventListener("change", () => {
    allowNsfw = elements.nsfwBox.checked;
    fetchMeme();
  });
  elements.likeBtn.addEventListener("click", () => toggleFavourite(elements.memeImg.src, elements.likeBtn));
  elements.themeBtn.addEventListener("click", toggleTheme);

  fetchMeme();
}

function isMemeFavourited(url) {
  return favouriteMemes.includes(url);
}

function fetchMeme() {
  const catvalue = elements.category.value;
  const apiUrl = (catvalue && catvalue !== "random") ? `https://meme-api.com/gimme/${catvalue}` : "https://meme-api.com/gimme";

  fetch(apiUrl)
    .then(response => response.json())
    .then(handleMemeData)
    .catch(console.error);
}

function handleMemeData(data) {
  if ((!allowNsfw && data.nsfw) || lastTenMemes.includes(data.url)) {
    fetchMeme();
  } else {
    lastTenMemes.unshift(data.url);
    lastTenMemes = lastTenMemes.slice(0, 10);
    elements.memeImg.src = data.url;

    updateRefreshTimer();
    updateLikeButton(data.url, elements.likeBtn);
    localStorage.setItem("lastTenMemes", JSON.stringify(lastTenMemes));
  }
}

function shareMeme(memeUrl) {
  if (navigator.share) {
    navigator.share({
        title: "Check out this meme!",
        text: "Found this hilarious meme",
        url: memeUrl
      })
      .catch((error) => console.error("Error sharing meme:", error));
  } else {
    alert("Web Share API is not supported on your device/browser.");
  }
}

function updateRefreshTimer() {
  clearInterval(refreshTimer);
  elements.timer.textContent = 30;

  refreshTimer = setInterval(() => {
    let secondsLeft = parseInt(elements.timer.textContent, 10);

    if (secondsLeft > 0) {
      elements.timer.textContent = --secondsLeft;
    } else {
      fetchMeme();
    }
  }, 1000);
}

function showSnackbar(message) {
  elements.snackbar.innerHTML = "";
  const toast = document.createElement("p");
  toast.textContent = message;
  toast.className = "toast show";
  elements.snackbar.appendChild(toast);
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
    toast.remove();
  }, 3000);
}

function updateLikeButton(url, likeButton) {
  likeButton.textContent = isMemeFavourited(url) ? "♥️" : "♡";
}

function toggleFavourite(memeUrl, likeButton) {
  const isCurrentlyFavourite = isMemeFavourited(memeUrl);

  if (isCurrentlyFavourite) {
    const index = favouriteMemes.indexOf(memeUrl);
    favouriteMemes.splice(index, 1);
    showSnackbar("Removed from favorites");
  } else {
    favouriteMemes.push(memeUrl);
    showSnackbar("Added to favorites");
  }

  updateLikeButton(memeUrl, likeButton);
  localStorage.setItem("favouriteMemes", JSON.stringify(favouriteMemes));
}

function removeFavourite(url, wrapper) {
  const index = favouriteMemes.indexOf(url);
  if (index !== -1) {
    favouriteMemes.splice(index, 1);
    localStorage.setItem("favouriteMemes", JSON.stringify(favouriteMemes));
    wrapper.style.display = "none";
  }
}

elements.favouritesShowBtn.addEventListener("click", () => {
  if (!favouriteMemes.length) {
    elements.favouritesContent.innerHTML = "<p>No favourite memes were found.</p>";
  } else {
    favouriteMemes.map((url, index) => {
      const wrapper = createWrapper(url, index, "Share", (url) => shareMeme(url), "Remove", (url, wrapper) => removeFavourite(url, wrapper));
      elements.favouritesContent.appendChild(wrapper);
    });
  }

  elements.favouriteDialog.showModal();
});

elements.favouritesCloseBtn.addEventListener("click", () => {
  elements.favouritesContent.innerHTML = "";
  elements.favouriteDialog.close();
});

elements.historyShowBtn.addEventListener("click", () => {
  if (!lastTenMemes.length) {
    elements.historyContent.innerHTML = "<p>No previous memes were found.</p>";
  } else {
    lastTenMemes.forEach((url, index) => {
      const wrapper = createWrapper(url, index, "Share", (url) => shareMeme(url), (isMemeFavourited(url) ? "♥️" : "♡"), (url, btn) => toggleFavourite(url, btn));
      elements.historyContent.appendChild(wrapper);
    });
  }

  elements.historyDialog.showModal();
});

elements.historyCloseBtn.addEventListener("click", () => {
  elements.historyContent.innerHTML = "";
  elements.historyDialog.close();
});

function createWrapper(url, index, btn1Text, btn1Callback, btn2Text, btn2Callback) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("wrapper");

  const memeImg = document.createElement("img");
  memeImg.src = url;
  memeImg.alt = `${btn2Text} meme ${index}`;

  const shareBtn = createButton(btn1Text, () => btn1Callback(url));

  const removeBtn = createButton(btn2Text, () => btn2Callback(url, wrapper));
  const likeBtn = createButton(btn2Text, () => btn2Callback(url, likeBtn));

  wrapper.appendChild(memeImg);
  wrapper.appendChild(shareBtn);

  if (btn2Text === "Remove") {
    wrapper.appendChild(removeBtn);
  } else {
    wrapper.appendChild(likeBtn);
  }

  return wrapper;
}

function createButton(text, callback) {
  const btn = document.createElement("button");
  btn.textContent = text;
  if (text === "Remove") btn.style.backgroundColor = "red";
  btn.addEventListener("click", callback);
  return btn;
}

function toggleTheme() {
  const newTheme = (currentTheme() === "dark") ? "light" : "dark";
  elements.html.dataset.theme = newTheme;
  localStorage.setItem("theme", newTheme);
  elements.themeBtn.textContent = (newTheme === "light") ? "☀︎" : "🌜";
}

const currentTheme = () => {
  return localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
};
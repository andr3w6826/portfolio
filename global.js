console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// const navLinks = $$("nav a");
// console.log(navLinks);  

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
//   );

// currentLink?.classList.add('current');


const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/portfolio/"               // when serving from localhost
    : "/portfolio/"; 


let pages = [
  { url: "index.html",         title: "Home"    },
  { url: "projects/index.html", title: "Projects" },
  { url: "resume/index.html",   title: "Resume"   },
  { url: "contact/index.html",  title: "Contact"  }
];


let nav = document.createElement("nav");
document.body.prepend(nav);


for (let p of pages) {
  let url   = p.url;
  let title = p.title;

  
    if (!url.startsWith("http")) {
        url = BASE_PATH + url;
    }

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname,
    );
    
    nav.append(a);
}

let gh = document.createElement("a");
gh.href = "https://github.com/andr3w6826";
gh.textContent = "GitHub";
gh.setAttribute("target", "_blank");
gh.setAttribute("rel", "noopener");
nav.append(gh);

document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <label class="color-scheme">
      Theme:

      <select id="theme-select">
        <option value="light dark">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );


const select = document.getElementById("theme-select");


const saved = localStorage.getItem("colorScheme");
if (saved) {
  document.documentElement.style.setProperty("color-scheme", saved);
  select.value = saved;
}

select.addEventListener("input", (e) => {
  const scheme = e.target.value; 
  console.log("color scheme changed to", scheme);

  document.documentElement.style.setProperty("color-scheme", scheme);

  // keep for next page load
  localStorage.setItem("colorScheme", scheme);
});

document.querySelector('form')?.addEventListener('submit', e => {
    e.preventDefault();
  
    const form    = e.target;
    const action  = form.action;
    const data    = new FormData(form);
    const parts   = [];
  
    for (let [name, value] of data) {
      parts.push(
        `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
      );
    }
  
    
    const url = action + '?' + parts.join('&');
  
    location.href = url;
    console.log('Final mailto URL:', url);
  });
  
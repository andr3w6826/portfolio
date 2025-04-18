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
    : "/portfolio/";    // https://github.com/andr3w6826/portfolio

/* your pages array stays the same */
let pages = [
  { url: "index.html",         title: "Home"    },
  { url: "projects/index.html", title: "Projects" },
  { url: "resume/index.html",   title: "Resume"   },
  { url: "contact/index.html",  title: "Contact"  }
];

// Create and insert the <nav>
let nav = document.createElement("nav");
document.body.prepend(nav);

// Build the links, prefixing with BASE_PATH when needed
for (let p of pages) {
  let url   = p.url;
  let title = p.title;

  // if it’s a relative path (not starting “http”), add the correct base
  if (!url.startsWith("http")) {
    url = BASE_PATH + url;
  }

  nav.insertAdjacentHTML("beforeend", `<a href="${url}">${title}</a>`);
}

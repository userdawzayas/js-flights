import { authSessionExpiredEvent, getAuthSession, logout } from "./auth.ts";
import { createCityAdmin } from "./components/city-admin.ts";
import { createLoginView } from "./components/login.ts";
import { createFlightSearchView } from "./components/city-search.ts";

const page = requiredElement<HTMLElement>(
  document,
  "#page-content",
  "No se encontró el contenedor de la página.",
);
const header = requiredElement<HTMLElement>(
  document,
  ".site-header",
  "No se encontró la navegación principal.",
);
const   authControls = requiredElement<HTMLElement>(
  document,
  "#auth-controls",
  "No se encontraron los controles de sesión.",
);

const handleRouteLinkClick = (event: MouseEvent): void => {
  console.log("Pulsado", event.target);

  const target = event.target;
  if (!(target instanceof Element)) return;

  const link = target.closest<HTMLAnchorElement>("a[data-route]");

  if (link) {
    event.preventDefault();
    if (window.location.hash === link.hash) {
      renderPage();
    } else {
      window.location.hash = link.hash;
    }
  }
};

header.addEventListener("click", handleRouteLinkClick);
page.addEventListener("click", handleRouteLinkClick);

function renderAuthControls(): void {
  authControls.replaceChildren();
  const session = getAuthSession();
  if (!session) {
    const loginLink = document.createElement("a");
    loginLink.href = "#/login";
    loginLink.dataset.route = "";
    loginLink.textContent = "Iniciar sesión";
    authControls.append(loginLink);
    return;
  }

  const accountName = document.createElement("span");
  accountName.className = "account-name";
  accountName.textContent = `${session.user.name} · ${session.user.role}`;
  const logoutButton = document.createElement("button");
  logoutButton.type = "button";
  logoutButton.textContent = "Cerrar sesión";
  logoutButton.addEventListener("click", () => {
    logout();
    const route = getCurrentRoute();
    renderAuthControls();
    if (route.path === "/cities") {
      navigateToLogin("/cities");
    } else {
      renderPage();
    }
  });
  authControls.append(accountName, logoutButton);
}

function getCurrentRoute(): {
  path: "/" | "/cities" | "/flights" | "/login";
  returnTo: "/" | "/cities" | "/flights";
} {
  const [requestedPath = "/", query = ""] = window.location.hash
    .slice(1)
    .split("?", 2);
  const path =
    requestedPath === "/cities" ||
    requestedPath === "/flights" ||
    requestedPath === "/login"
      ? requestedPath
      : "/";
  const requestedReturnTo = new URLSearchParams(query).get("returnTo");
  const returnTo =
    requestedReturnTo === "/cities" || requestedReturnTo === "/flights"
      ? requestedReturnTo
      : "/";
  return { path, returnTo };
}

function navigateTo(route: string): void {
  const url = new URL(window.location.href);
  url.hash = route;
  window.history.replaceState(null, "", url);
  renderPage();
}

function navigateToLogin(returnTo: "/cities"): void {
  const route = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  const url = new URL(window.location.href);
  url.hash = route;
  window.history.replaceState(null, "", url);
  renderLogin(returnTo);
}

function renderLogin(returnTo: "/" | "/cities" | "/flights"): void {
  page.replaceChildren(createLoginView(() => navigateTo(returnTo)));
}

function renderUnauthorized(): void {
  const section = document.createElement("section");
  section.className = "page-section";
  const heading = document.createElement("h1");
  heading.textContent = "Acceso restringido";
  const message = document.createElement("p");
  message.className = "intro";
  message.textContent =
    "Tu cuenta no tiene permisos de administrador para gestionar ciudades.";
  section.append(heading, message);
  page.replaceChildren(section);
}

function renderHome(): void {
  const section = document.createElement("section");
  section.className = "welcome";
  section.append(
    createTextElement("p", "eyebrow", "Planifica tu próximo viaje"),
    createTextElement("h1", "", "¿A dónde quieres volar?"),
    createTextElement(
      "p",
      "",
      "Busca vuelos o administra las ciudades disponibles.",
    ),
  );

  const actions = document.createElement("div");
  actions.className = "home-actions";
  actions.append(
    createActionCard(
      "#/flights",
      "✈",
      "Buscar vuelos",
      "Elige origen y destino",
    ),
    createActionCard(
      "#/cities",
      "⌖",
      "Administrar ciudades",
      "Crear, modificar y borrar",
    ),
  );
  section.append(actions);
  page.replaceChildren(section);
}

function renderCityAdmin(): void {
  page.replaceChildren(createCityAdmin());
}

function renderFlightSearch(): void {
  page.replaceChildren(createFlightSearchView());
}

function renderPage(): void {
  renderAuthControls();
  const route = getCurrentRoute();
  if (route.path === "/cities") {
    const session = getAuthSession();
    if (!session) {
      navigateToLogin("/cities");
    } else if (session.user.role !== "ADMIN") {
      renderUnauthorized();
    } else {
      renderCityAdmin();
    }
  } else if (route.path === "/login") {
    renderLogin(route.returnTo);
  } else if (route.path === "/flights") {
    renderFlightSearch();
  } else {
    renderHome();
  }
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string,
  message: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(message);
  return element;
}

function createTextElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className: string,
  text: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createActionCard(
  route: string,
  icon: string,
  title: string,
  description: string,
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "action-card";
  link.href = route;
  link.dataset.route = "";

  const iconElement = createTextElement("span", "action-icon", icon);
  iconElement.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.append(
    createTextElement("strong", "", title),
    createTextElement("small", "", description),
  );
  link.append(iconElement, text);
  return link;
}

window.addEventListener("hashchange", renderPage);
window.addEventListener(authSessionExpiredEvent, () => {
  renderAuthControls();
  if (getCurrentRoute().path === "/cities") {
    navigateToLogin("/cities");
  }
});
renderPage();

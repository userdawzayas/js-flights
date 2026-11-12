import { login } from "../services/auth.js";

export function createLoginView(
  onLogin: () => void,
): HTMLElement {
  const section = document.createElement("section");
  section.className = "page-section login-page";
  const heading = document.createElement("h1");
  heading.textContent = "Iniciar sesión";
  const intro = document.createElement("p");
  intro.className = "intro";
  intro.textContent = "Accede para administrar las ciudades.";

  const form = document.createElement("form");
  form.id = "login-form";
  form.className = "login-form";
  const nameLabel = document.createElement("label");
  nameLabel.htmlFor = "login-name";
  nameLabel.textContent = "Usuario";
  const nameInput = document.createElement("input");
  nameInput.id = "login-name";
  nameInput.name = "name";
  nameInput.type = "text";
  nameInput.autocomplete = "username";
  nameInput.required = true;
  const passwordLabel = document.createElement("label");
  passwordLabel.htmlFor = "login-password";
  passwordLabel.textContent = "Contraseña";
  const passwordInput = document.createElement("input");
  passwordInput.id = "login-password";
  passwordInput.name = "password";
  passwordInput.type = "password";
  passwordInput.autocomplete = "current-password";
  passwordInput.required = true;
  const message = document.createElement("p");
  message.className = "login-message";
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Entrar";

  form.append(
    nameLabel,
    nameInput,
    passwordLabel,
    passwordInput,
    message,
    submitButton,
  );
  section.append(heading, intro, form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    message.textContent = "";
    message.dataset.error = "false";

    void submitLogin();
  });

  async function submitLogin(): Promise<void> {
    try {
      await login(nameInput.value, passwordInput.value);
      passwordInput.value = "";
      onLogin();
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      message.textContent =
        error instanceof Error ? error.message : "No se pudo iniciar sesión.";
      message.dataset.error = "true";
    } finally {
      submitButton.disabled = false;
    }
  }

  return section;
}

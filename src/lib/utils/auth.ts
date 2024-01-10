import { ux } from "@oclif/core";
import { api } from "../api";
import validateUrl from "./validate-url";

export async function getDirectusUrl() {
  const directusUrl = await ux.prompt("What is your Directus URL?", {default:"http://localhost:8055"});
  // Validate URL
  if (!validateUrl(directusUrl)) {
    ux.warn("Invalid URL");
    return getDirectusUrl();
  }

  return directusUrl;
}

export async function getDirectusToken(directusUrl: string) {
  const directusToken = await ux.prompt("What is your Directus Admin Token?");
  // Validate token
  try {
    await api.get("/users/me", {
      headers: {
        Authorization: `Bearer ${directusToken}`,
      },
    });
    return directusToken;
  } catch {
    ux.warn("Invalid token");
    return getDirectusToken(directusUrl);
  }
}

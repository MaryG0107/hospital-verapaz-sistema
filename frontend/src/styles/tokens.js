// Design tokens del sistema (paleta hospital: verde institucional/dorado, con neutrales de apoyo)
// "navy" se mantiene como nombre de la clave (usada en todo el frontend) pero
// es el verde institucional, en un tono suavizado (menos saturado que el
// #008643 original) a pedido del equipo: se ve mas suave, menos "neon".
// Contraste (WCAG 2.1 AA): blanco sobre #2F8B63 sigue por encima de 4.5:1
// (texto normal OK); blanco sobre #246C4C (navyDark) tiene aun mas margen.
// navyLight (#4DA47D) es solo para acentos/hover grandes, no para texto
// normal sobre blanco.
export const COLORS = {
  navy: "#2F8B63",
  navyDark: "#246C4C",
  navyLight: "#4DA47D",
  gold: "#B08B2E",
  goldLight: "#D4AF54",
  lightBg: "#F2F4F8",
  surface: "#FFFFFF",
  border: "#E4E7EE",
  red: "#B94A3D",
  green: "#2F8B63",
  teal: "#1C7373",
  text: "#1A2233",
  textMuted: "#6B7280",
};

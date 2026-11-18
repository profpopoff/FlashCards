export type Scheme = "light" | "dark";
export type AppearancePreference = "system" | Scheme;

export type Palette = {
  background: string;
  shell: string;
  surface: string;
  ink: string;
  muted: string;
  indigo: string;
  indigoFill: string;
  onIndigo: string;
  onInk: string;
  heroButton: string;
  line: string;
  track: string;
  segment: string;
  segmentActive: string;
  tableHead: string;
  tabBar: string;
  tabInactive: string;
  again: string;
  againBg: string;
  hard: string;
  hardBg: string;
  good: string;
  goodBg: string;
  easy: string;
  easyBg: string;
  placeholder: string;
  backdrop: string;
  dashed: string;
};

export const lightColors: Palette = {
  background: "#F4F1EB",
  shell: "#E6E1D6",
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8B84",
  indigo: "#4F3DFF",
  indigoFill: "#4F3DFF",
  onIndigo: "#FFFFFF",
  onInk: "#FFFFFF",
  heroButton: "#FFFFFF",
  line: "#E6E2DA",
  track: "#E4E0D6",
  segment: "#E8E4DB",
  segmentActive: "#FFFFFF",
  tableHead: "#F3EFE7",
  tabBar: "#FFFCF8",
  tabInactive: "#9A968E",
  again: "#C4544A",
  againBg: "#FBE7E4",
  hard: "#C4842C",
  hardBg: "#F8EEDC",
  good: "#3B74BE",
  goodBg: "#E3F0FB",
  easy: "#2E8B57",
  easyBg: "#E2F6EA",
  placeholder: "#B0ACA4",
  backdrop: "rgba(28,28,30,0.35)",
  dashed: "#C8C4BC",
};

export const darkColors: Palette = {
  background: "#161513",
  shell: "#0C0B0A",
  surface: "#24211D",
  ink: "#F3EFE8",
  muted: "#A39E94",
  indigo: "#C4B8FF",
  indigoFill: "#4F3DFF",
  onIndigo: "#FFFFFF",
  onInk: "#161513",
  heroButton: "#FFFFFF",
  line: "#34302B",
  track: "#2E2B27",
  segment: "#2A2723",
  segmentActive: "#3C3832",
  tableHead: "#1C1A17",
  tabBar: "#1C1A17",
  tabInactive: "#8A857C",
  again: "#F0A39C",
  againBg: "#3A2422",
  hard: "#E8B86A",
  hardBg: "#3A2E1C",
  good: "#9EC4F0",
  goodBg: "#1C2A3A",
  easy: "#8ED4AE",
  easyBg: "#1A3326",
  placeholder: "#8E8B84",
  backdrop: "rgba(0,0,0,0.6)",
  dashed: "#4A463F",
};

export function paletteFor(scheme: Scheme): Palette {
  return scheme === "dark" ? darkColors : lightColors;
}

export function tint(hex: string, alpha: number) {
  const channels = parseHex(hex);
  if (!channels) return hex;
  const [red, green, blue] = channels;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function tagAppearance(hex: string, scheme: Scheme, surface: string) {
  if (scheme === "light") {
    return { color: hex, backgroundColor: tint(hex, 0.14) };
  }
  return {
    color: mix(hex, "#FFFFFF", 0.55),
    backgroundColor: mix(hex, surface, 0.72),
  };
}

export function formatStudyDate(date = new Date()) {
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const day = date.toLocaleDateString("en-GB", { day: "numeric" });
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  return `${weekday}, ${day} ${month}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : value;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const color = Number.parseInt(normalized, 16);
  return [(color >> 16) & 255, (color >> 8) & 255, color & 255];
}

function mix(hex: string, target: string, targetAmount: number) {
  const from = parseHex(hex);
  const to = parseHex(target);
  if (!from || !to) return hex;
  const amount = Math.min(1, Math.max(0, targetAmount));
  const mixed = from.map((channel, index) => Math.round(channel * (1 - amount) + to[index] * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

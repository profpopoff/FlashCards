export const colors = {
  background: "#F4F1EB",
  shell: "#E6E1D6",
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8B84",
  indigo: "#4F3DFF",
  indigoPressed: "#3F31D6",
  line: "#E6E2DA",
  track: "#E4E0D6",
  segment: "#E8E4DB",
  tableHead: "#F3EFE7",
  again: "#C4544A",
  againBg: "#FBE7E4",
  hard: "#C4842C",
  hardBg: "#F8EEDC",
  good: "#3B74BE",
  goodBg: "#E3F0FB",
  easy: "#2E8B57",
  easyBg: "#E2F6EA",
  placeholder: "#B0ACA4",
};

export function tint(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : value;
  const color = Number.parseInt(normalized, 16);
  const red = (color >> 16) & 255;
  const green = (color >> 8) & 255;
  const blue = color & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function formatStudyDate(date = new Date()) {
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const day = date.toLocaleDateString("en-GB", { day: "numeric" });
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  return `${weekday}, ${day} ${month}`;
}

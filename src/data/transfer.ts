import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { createLibraryExport, exportFileName, ImportPreview, parseLibraryExport } from "@/data/library-io";
import { Library } from "@/data/types";

export function isLibraryTransferSupported() {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export async function exportLibraryFile(library: Library) {
  if (!isLibraryTransferSupported()) {
    throw new Error("Export is available on iOS and Android only.");
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }

  const payload = createLibraryExport(library);
  const file = new File(Paths.cache, exportFileName());
  if (file.exists) {
    file.delete();
  }
  file.create();
  await file.write(JSON.stringify(payload, null, 2));

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    UTI: "public.json",
    dialogTitle: "Export flashcards library",
  });
}

export async function pickLibraryImport(): Promise<ImportPreview | null> {
  if (!isLibraryTransferSupported()) {
    throw new Error("Import is available on iOS and Android only.");
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "public.json", "text/json"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const file = new File(asset.uri);
  const raw = await file.text();
  const preview = parseLibraryExport(raw);
  if (!preview) {
    throw new Error("This file is not a valid flashcards library export.");
  }
  return preview;
}

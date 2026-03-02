import { requireNativeModule, Platform } from "expo-modules-core";

type BlockResult = {
  success: boolean;
  error?: string;
};

type NativeModule = {
  requestAuthorization(): Promise<BlockResult>;
  activateBlocking(domains: string[], bundleIds: string[], durationMinutes: number): Promise<BlockResult>;
  deactivateBlocking(): Promise<BlockResult>;
  isBlockingActive(): Promise<boolean>;
};

const FocusBlockNative: NativeModule = requireNativeModule("FocusBlockNative");

export async function requestAuthorization(): Promise<BlockResult> {
  return FocusBlockNative.requestAuthorization();
}

export async function activateBlocking(
  domains: string[],
  bundleIds: string[],
  durationMinutes: number,
): Promise<BlockResult> {
  return FocusBlockNative.activateBlocking(domains, bundleIds, durationMinutes);
}

export async function deactivateBlocking(): Promise<BlockResult> {
  return FocusBlockNative.deactivateBlocking();
}

export async function isBlockingActive(): Promise<boolean> {
  return FocusBlockNative.isBlockingActive();
}

export default FocusBlockNative;

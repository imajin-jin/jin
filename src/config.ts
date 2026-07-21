/**
 * Runtime configuration. Everything comes from env; no hardcoded URLs in
 * app code (see .env.example). `EXPO_PUBLIC_*` is the only prefix Expo
 * inlines into the client bundle.
 */

const DEFAULT_KERNEL_URL = 'https://dev-jin.imajin.ai';

/** Kernel front door — `/auth`, `/media`, `/mcp` live underneath. */
export const KERNEL_URL: string = process.env.EXPO_PUBLIC_KERNEL_URL ?? DEFAULT_KERNEL_URL;

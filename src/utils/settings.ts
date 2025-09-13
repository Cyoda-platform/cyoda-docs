/**
 * Settings utility module for managing user preferences
 * Handles theme and API renderer settings
 */

export type Theme = 'auto' | 'light' | 'dark';
export type ApiRenderer = 'scalar' | 'stoplight';

export interface UserSettings {
  theme: Theme;
  apiRenderer: ApiRenderer;
}

export class SettingsManager {
  private static instance: SettingsManager;

  // Local storage keys
  private readonly THEME_KEY = 'starlight-theme';
  private readonly API_RENDERER_KEY = 'cyoda-api-renderer';

  // Default values
  private readonly DEFAULT_THEME: Theme = 'auto';
  private readonly DEFAULT_API_RENDERER: ApiRenderer = 'scalar';

  private constructor() {}

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Get current theme setting
   */
  getTheme(): Theme {
    if (typeof window === 'undefined') return this.DEFAULT_THEME;
    const theme = localStorage.getItem(this.THEME_KEY) as Theme;
    return this.isValidTheme(theme) ? theme : this.DEFAULT_THEME;
  }

  /**
   * Set theme and persist to localStorage
   */
  setTheme(theme: Theme): void {
    if (!this.isValidTheme(theme)) {
      console.warn(`Invalid theme: ${theme}. Using default.`);
      theme = this.DEFAULT_THEME;
    }

    if (typeof window === 'undefined') return;

    // Update DOM
    document.documentElement.setAttribute('data-theme', theme);

    // Update localStorage (for Starlight compatibility)
    localStorage.setItem(this.THEME_KEY, theme);

    // Dispatch custom event for other components to listen
    this.dispatchSettingsChange('theme', theme);
  }

  /**
   * Get current API renderer setting
   */
  getApiRenderer(): ApiRenderer {
    const renderer = localStorage.getItem(this.API_RENDERER_KEY) as ApiRenderer;
    return this.isValidApiRenderer(renderer) ? renderer : this.DEFAULT_API_RENDERER;
  }

  /**
   * Set API renderer and persist
   */
  setApiRenderer(renderer: ApiRenderer): void {
    if (!this.isValidApiRenderer(renderer)) {
      console.warn(`Invalid API renderer: ${renderer}. Using default.`);
      renderer = this.DEFAULT_API_RENDERER;
    }

    localStorage.setItem(this.API_RENDERER_KEY, renderer);

    // Dispatch custom event
    this.dispatchSettingsChange('apiRenderer', renderer);
  }

  /**
   * Get all current settings
   */
  getSettings(): UserSettings {
    return {
      theme: this.getTheme(),
      apiRenderer: this.getApiRenderer()
    };
  }

  /**
   * Update multiple settings at once
   */
  updateSettings(settings: Partial<UserSettings>): void {
    if (settings.theme) {
      this.setTheme(settings.theme);
    }
    if (settings.apiRenderer) {
      this.setApiRenderer(settings.apiRenderer);
    }
  }

  /**
   * Get API reference URL based on current renderer setting
   */
  getApiReferenceUrl(): string {
    return '/api-reference/';
  }

  /**
   * Initialize settings from stored values
   */
  initialize(): void {
    const theme = this.getTheme();
    if (theme !== 'auto') {
      this.setTheme(theme);
    }
  }

  /**
   * Clear all settings (reset to defaults)
   */
  reset(): void {
    this.setTheme(this.DEFAULT_THEME);
    this.setApiRenderer(this.DEFAULT_API_RENDERER);
  }

  // Private helper methods

  private isValidTheme(theme: string): theme is Theme {
    return ['auto', 'light', 'dark'].includes(theme);
  }

  private isValidApiRenderer(renderer: string): renderer is ApiRenderer {
    return ['scalar', 'stoplight'].includes(renderer);
  }

  private dispatchSettingsChange(setting: keyof UserSettings, value: Theme | ApiRenderer): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent('cyoda:settings-change', {
      detail: { setting, value }
    });
    window.dispatchEvent(event);
  }
}

// Export singleton instance
export const settingsManager = SettingsManager.getInstance();

// Export convenience functions
export const getTheme = () => settingsManager.getTheme();
export const setTheme = (theme: Theme) => settingsManager.setTheme(theme);
export const getApiRenderer = () => settingsManager.getApiRenderer();
export const setApiRenderer = (renderer: ApiRenderer) => settingsManager.setApiRenderer(renderer);
export const getApiReferenceUrl = () => settingsManager.getApiReferenceUrl();
export const getSettings = () => settingsManager.getSettings();
export const updateSettings = (settings: Partial<UserSettings>) => settingsManager.updateSettings(settings);
export const initializeSettings = () => settingsManager.initialize();
export const resetSettings = () => settingsManager.reset();

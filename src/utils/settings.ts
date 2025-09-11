/**
 * Settings utility module for managing user preferences
 * Handles theme and API renderer settings with cookie persistence
 */

export type Theme = 'auto' | 'light' | 'dark';
export type ApiRenderer = 'scalar' | 'stoplight';

export interface UserSettings {
  theme: Theme;
  apiRenderer: ApiRenderer;
}

export class SettingsManager {
  private static instance: SettingsManager;
  
  // Cookie names
  private readonly THEME_COOKIE = 'cyoda-theme';
  private readonly API_RENDERER_COOKIE = 'cyoda-api-renderer';
  private readonly STARLIGHT_THEME_KEY = 'starlight-theme';
  
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
    
    // Check localStorage first (Starlight's preference)
    const starlightTheme = localStorage.getItem(this.STARLIGHT_THEME_KEY) as Theme;
    if (starlightTheme && this.isValidTheme(starlightTheme)) {
      return starlightTheme;
    }
    
    // Fallback to cookie
    const cookieTheme = this.getCookie(this.THEME_COOKIE) as Theme;
    if (cookieTheme && this.isValidTheme(cookieTheme)) {
      return cookieTheme;
    }
    
    return this.DEFAULT_THEME;
  }
  
  /**
   * Set theme and persist to both localStorage and cookie
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
    localStorage.setItem(this.STARLIGHT_THEME_KEY, theme);
    
    // Update cookie (for persistence across sessions)
    this.setCookie(this.THEME_COOKIE, theme, 365);
    
    // Dispatch custom event for other components to listen
    this.dispatchSettingsChange('theme', theme);
  }
  
  /**
   * Get current API renderer setting
   */
  getApiRenderer(): ApiRenderer {
    const renderer = this.getCookie(this.API_RENDERER_COOKIE) as ApiRenderer;
    return this.isValidApiRenderer(renderer) ? renderer : this.DEFAULT_API_RENDERER;
  }
  
  /**
   * Set API renderer and persist to cookie
   */
  setApiRenderer(renderer: ApiRenderer): void {
    if (!this.isValidApiRenderer(renderer)) {
      console.warn(`Invalid API renderer: ${renderer}. Using default.`);
      renderer = this.DEFAULT_API_RENDERER;
    }
    
    this.setCookie(this.API_RENDERER_COOKIE, renderer, 365);
    
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
    const renderer = this.getApiRenderer();
    return renderer === 'scalar' ? '/api-reference-scalar/' : '/api-reference-stoplight/';
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
  
  private setCookie(name: string, value: string, days: number): void {
    if (typeof document === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    // Set cookie with security attributes
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure=${location.protocol === 'https:'}`;
  }
  
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
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

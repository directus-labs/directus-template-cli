import { Command, type Config } from '@oclif/core';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'pathe';

interface UserConfig {
  disableTelemetry?: boolean;
  distinctId?: string | null;
}

export abstract class BaseCommand extends Command {
  public runId: string;
  public userConfig: UserConfig = {};

  constructor(argv: string[], config: Config) {
    super(argv, config);
    this.runId = randomUUID();
    this.loadUserConfig();
  }

  private loadUserConfig(): void {
    try {
      const configPath = path.join(this.config.configDir, 'config.json');
      if (fs.existsSync(configPath)) {
        this.userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        // Create default config if it doesn't exist
        const defaultConfig: UserConfig = {
          disableTelemetry: true,
          distinctId: randomUUID(),
        };
        fs.mkdirSync(this.config.configDir, { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        this.userConfig = defaultConfig;
      }
    } catch (error) {
      this.warn(`Failed to load user config: ${error}`);
    }
  }

  /**
   * Save the current user configuration to disk
   */
  protected saveUserConfig(): void {
    try {
      const configPath = path.join(this.config.configDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(this.userConfig, null, 2));
    } catch (error) {
      this.warn(`Failed to save user config: ${error}`);
    }
  }
}

import type { StatsModule } from "webpack";

export interface IStatsModule extends StatsModule {
  vscodeExporterPath: string;
  vscodeImporterPath: string;
}

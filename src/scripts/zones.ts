class ZonesGenerator {
  static zones: ZoneInfo[];

  static FindZone(zoneName: string): string[] {
    let zones = [];
    for (let i = 0; i < this.zones.length; i++) {
      let index = this.zones[i].name
        .toLowerCase()
        .indexOf(zoneName.toLowerCase());
      if (index != -1) {
        zones.push({ name: this.zones[i].name, index: index });
      }
    }

    return zones.sort(this.compare).map((nameIndex) => nameIndex.name).slice(0, 10);
  }

  static compare(zoneName1: any, zoneName2: any) {
    if (zoneName1.index > zoneName2.index) {
      return 1;
    } else if (zoneName1.index < zoneName2.index) {
      return -1;
    }

    return 0;
  }

  static GetZone(zoneName: string): ZoneInfo {
    for (let i = 0; i < this.zones.length; i++) {
      if (this.zones[i].name.toLowerCase() == zoneName.toLowerCase()) {
        return this.zones[i];
      }
    }

    return null;
  }

  static async SetupZones(): Promise<void> {
    ZonesGenerator.zones = [];
    ZonesGenerator.zones = await this.fetchZonesJson();

    ZonesGenerator.zones = ZonesGenerator.zones.filter(x => x.color != " ");
  }

  static async fetchZonesJson() {
    const url =
      "https://raw.githubusercontent.com/HamzaNa1/data-dump/main/zones.json";

    return await (await fetch(url)).json();
  }
}

export interface ZoneInfo {
  id: number;
  albionId: string;
  name: string;
  tier: string;
  color: string;
  type: string;
  isDeep: boolean;
}

export default ZonesGenerator;

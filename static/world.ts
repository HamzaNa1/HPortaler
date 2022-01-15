import type { ZoneInfo } from "./zones";
import { SetupDatabase, DeleteConnection, LoadConnections, SaveConnection } from "./database";
import ZonesGenerator from "./zones";
import { isLoaded, screenSize } from "./stores";
import { shuffle } from "./utils";

export class World {
  selectedBall: Ball;
  balls: Ball[];
  connections: Connection[];

  isLoaded: boolean;
  screenSize: { x: number; y: number };

  angles: number[];

  constructor() {
    this.selectedBall = null;
    this.balls = [];
    this.connections = [];
    this.isLoaded = false;
    this.screenSize = { x: 0, y: 0 };

    SetupDatabase(this);

    isLoaded.subscribe((value) => {
      this.isLoaded = value;
    });

    screenSize.subscribe((value) => {
      this.screenSize = value;
    });

    this.angles = [];
    for (let i = 0; i < 360; i++) {
      this.angles[i] = i;
    }

    this.Load();
  }

  async Load() {
    if (this.isLoaded == true) {
      return;
    }

    await ZonesGenerator.SetupZones();

    let connections = await LoadConnections();
    for (let i = 0; i < connections.length; i++) {
      this.AddConnectionFromInfo(connections[i], false);
    }

    isLoaded.set(true);
    this.SortAll();
  }

  public Reload(connections : ConnectionInfo[]) {
    this.connections = [];
    this.balls = [];

    for (let i = 0; i < connections.length; i++) {
      this.AddConnectionFromInfo(connections[i], false);
    }
    
    this.SortAll();
  }

  public SortAll() {
    if (this.balls.length == 0) {
      return;
    }

    for (let i = 0; i < this.balls.length; i++) {
      this.balls[i].x = -10000;
      this.balls[i].y = -10000;
    }

    let home = this.balls.find((x) => x.zone.name == "Setent-Qintis");
    if (!home) {
      home = this.balls[0];
    }
    home.x = 0;
    home.y = 0;

    let unsorted = this.balls.slice();

    this.Sort(home, unsorted);

    while(unsorted.length > 0) {
      home = unsorted[0];

      let bestPosition = { x: 0, y: 0 };
      let bestScore = Number.MIN_SAFE_INTEGER;

      for(let i = 0; i < 1000; i++) {
        let x = (Math.random() * 2 - 1) * (this.screenSize.x / 2);
        let y = (Math.random() * 2 - 1) * (this.screenSize.y / 2);

        let score = this.RatePosition(x, y);

        if (score > bestScore) {
          bestScore = score;
          bestPosition = {x: x, y: y};
        }

        if(score >= 200) {
          break;
        }
      }

      home.x = bestPosition.x;
      home.y = bestPosition.y;

      this.Sort(home, unsorted);
    }
  }

  private Sort(center: Ball, unsorted: Ball[]) {
    unsorted.splice(unsorted.indexOf(center), 1);

    let connected = this.GetConnectedBalls(center);
    for (let i = 0; i < connected.length; i++) {
      if (!unsorted.includes(connected[i])) {
        continue;
      }
      const distance = 200;

      let bestPosition = { x: 0, y: 0 };
      let bestScore = Number.MIN_SAFE_INTEGER;

      this.angles = shuffle(this.angles);

      for (let r = 0; r < 360; r++) {
        let angle = (this.angles[r] / 180) * Math.PI;

        let position = {
          x: center.x + Math.cos(angle) * distance,
          y: center.y + Math.sin(angle) * distance,
        };
        let score = this.RatePosition(position.x, position.y);

        if (score > bestScore) {
          bestScore = score;
          bestPosition = position;
        }

        if(score >= 200) {
          break;
        }
      }

      connected[i].x = bestPosition.x;
      connected[i].y = bestPosition.y;

      this.Sort(connected[i], unsorted);
    }
  }

  private RatePosition(x: number, y: number) {
    if (
      x < -this.screenSize.x / 2 + 20 ||
      x >= this.screenSize.x / 2 - 20 ||
      y < -this.screenSize.y / 2 + 20 ||
      y >= this.screenSize.y / 2 - 50
    ) {
      return Number.MIN_VALUE;
    }

    let closestDistance = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < this.balls.length; i++) {
      let currentBall = this.balls[i];

      closestDistance = Math.min(
        closestDistance,
        this.Distance(x, y, currentBall.x, currentBall.y)
      );
    }

    return Math.min(closestDistance, 200);
  }

  private Distance(x1: number, y1: number, x2: number, y2: number) {
    let x = x1 - x2;
    let y = y1 - y2;

    return Math.sqrt(x * x + y * y);
  }

  GetBall(zone: ZoneInfo) {
    for (let i = 0; i < this.balls.length; i++) {
      if (this.balls[i].zone == zone) {
        return this.balls[i];
      }
    }

    return this.AddBall(zone);
  }

  AddBall(zone: ZoneInfo) {
    let ball: Ball = {
      x: 0,
      y: 0,
      radius: 20,
      zone: zone,
    };

    this.balls.push(ball);
    return ball;
  }

  AddConnection(
    startZone: ZoneInfo,
    endZone: ZoneInfo,
    connectionType: string,
    endTime: number,
    save: boolean = true
  ) {
    if (this.ConnectionExists(startZone, endZone)) return;

    let start = this.GetBall(startZone);
    let end = this.GetBall(endZone);

    let connection: Connection = {
      id: this.GenerateId(),
      start: start,
      end: end,
      type: connectionType,
      endTime: endTime,
    };

    this.connections.push(connection);
    if (save) {
      SaveConnection(connection);
    }
  }

  AddConnectionFromInfo(info: ConnectionInfo, save: boolean = true) {
    let startZone = ZonesGenerator.GetZone(info.start);
    let endZone = ZonesGenerator.GetZone(info.end);

    if (
      startZone == null ||
      endZone == null ||
      this.ConnectionExists(startZone, endZone)
    ) {
      return;
    }

    let start = this.GetBall(startZone);
    let end = this.GetBall(endZone);

    let connection: Connection = {
      id: info.id,
      start: start,
      end: end,
      type: info.type,
      endTime: info.endTime,
    };

    this.connections.push(connection);
    if (save) {
      SaveConnection(connection);
    }
  }

  GetConnections(ball: Ball): Connection[] {
    let ballConnections = [];

    for (let i = 0; i < this.connections.length; i++) {
      let connection = this.connections[i];
      if (
        connection.start.zone == ball.zone ||
        connection.end.zone == ball.zone
      )
        ballConnections.push(connection);
    }

    return ballConnections;
  }

  GetConnectedBalls(ball: Ball): Ball[] {
    let connected = [];

    let connections = this.GetConnections(ball);
    for (let i = 0; i < connections.length; i++) {
      if (connections[i].start == ball) {
        connected.push(connections[i].end);
      } else {
        connected.push(connections[i].start);
      }
    }

    return connected;
  }

  ConnectionExists(zone1: ZoneInfo, zone2: ZoneInfo): boolean {
    for (let i = 0; i < this.connections.length; i++) {
      let connection = this.connections[i];
      if (
        (connection.start.zone == zone1 && connection.end.zone == zone2) ||
        (connection.end.zone == zone1 && connection.start.zone == zone2)
      )
        return true;
    }

    return false;
  }

  GetBallAt(x: number, y: number): Ball {
    for (let i = 0; i < this.balls.length; i++) {
      let ball = this.balls[i];
      let _x = ball.x - x;
      let _y = ball.y - y;

      if (Math.sqrt(_x * _x + _y * _y) <= ball.radius) {
        return ball;
      }
    }

    return null;
  }

  CheckConnections(): void {
    const date = new Date();
    this.connections.forEach((connection) => {
      if (connection.endTime < date.getTime()) {
        this.RemoveConnection(connection);
      }
    });
  }

  RemoveConnection(connection: Connection): void {
    let b1 = connection.start;
    let b2 = connection.end;
    this.connections.splice(this.connections.indexOf(connection), 1);

    if (this.GetConnections(b1).length == 0) {
      this.balls.splice(this.balls.indexOf(b2), 1);
    }

    if (this.GetConnections(b2).length == 0) {
      this.balls.splice(this.balls.indexOf(b2), 1);
    }

    DeleteConnection(connection);
  }

  DeleteBall(ball: Ball): void {
    this.GetConnections(ball).forEach((connection) => {
      this.RemoveConnection(connection);
    });
  }

  GenerateId(): string {
    const characters =
      "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890-_";
    let id = "";
    for (let i = 0; i < 32; i++) {
      id += characters[Math.floor(Math.random() * characters.length)];
    }

    return id;
  }
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  zone: ZoneInfo;
}

export interface Connection {
  id: string;
  start: Ball;
  end: Ball;
  type: string;
  endTime: number;
}
export interface ConnectionInfo {
  id: string;
  start: string;
  end: string;
  type: string;
  endTime: number;
}

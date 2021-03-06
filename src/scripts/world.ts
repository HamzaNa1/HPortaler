import type { ZoneInfo } from "./zones";
import { database } from "./database";
import ZonesGenerator from "./zones";
import { isLoaded, screenSize, distanceSetting, scaleSetting } from "./stores";
import { shuffle } from "./utils";

export class World {
  selectedBall: Ball;
  balls: Ball[];
  connections: Connection[];

  isLoaded: boolean;
  isLoggedIn: boolean;
  screenSize: { x: number; y: number };

  distance: number;
  scale: number;

  angles: number[];

  constructor() {
    this.selectedBall = null;
    this.balls = [];
    this.connections = [];
    this.isLoaded = false;
    this.screenSize = { x: 0, y: 0 };
    this.distance = 200;
    this.scale = 1;

    distanceSetting.subscribe((value) => {
      this.distance = value;
      this.SortAll();
    });

    scaleSetting.subscribe((value) => {
      this.scale = value;
    });

    database.onUpdate(this);

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

    let connections = await database.loadConnections();
    for (let i = 0; i < connections.length; i++) {
      this.AddConnectionFromInfo(connections[i], false);
    }

    isLoaded.set(true);
  }

  public Reload(connections: ConnectionInfo[]) {
    this.connections = [];
    this.balls = [];

    for (let i = 0; i < connections.length; i++) {
      this.AddConnectionFromInfo(connections[i], false);
    }

    this.SortAll("R");
  }

  public SortAll(a : string = "") {
    if (this.balls.length == 0) {
      return;
    }

    let bestPositions: RatedPosition[] = null;
    let bestRating = Number.MIN_SAFE_INTEGER;

    for (let i = 0; i < 40; i++) {
      for (let i = 0; i < this.balls.length; i++) {
        this.balls[i].x = -10000;
        this.balls[i].y = -10000;
      }

      let home = this.balls.find((x) => x.zone.name == "Setent-Qintis");
      if (!home) {
        home = this.balls.find((x) => x.zone.name == "Everwinter Expanse");
        if (!home) {
          home = this.balls[Math.floor(Math.random() * this.balls.length)];
        }
      }

      home.x = 0;
      home.y = 0;

      let unsorted = this.balls.slice();

      this.Sort(home, unsorted);

      while (unsorted.length > 0) {
        home = unsorted[0];

        let bestPosition = { x: 0, y: 0 };
        let bestScore = Number.MIN_SAFE_INTEGER;

        for (let i = 0; i < 1000; i++) {
          let x = (Math.random() * 2 - 1) * (this.screenSize.x / 2);
          let y = (Math.random() * 2 - 1) * (this.screenSize.y / 2);

          let score = this.RatePosition(x, y);

          if (score > bestScore) {
            bestScore = score;
            bestPosition = { x: x, y: y };
          }

          if (score >= this.distance) {
            break;
          }
        }

        home.x = bestPosition.x;
        home.y = bestPosition.y;

        this.Sort(home, unsorted);
      }

      let rating = this.RateOverall();
      if (rating > bestRating) {
        bestRating = rating;
        bestPositions = this.SaveCurrentPositions();
      }
    }

    this.LoadPositions(bestPositions);
  }

  private SaveCurrentPositions(): RatedPosition[] {
    let positions = [];

    for (let i = 0; i < this.balls.length; i++) {
      let position: RatedPosition = {
        ball: this.balls[i],
        x: this.balls[i].x,
        y: this.balls[i].y,
      };

      positions.push(position);
    }

    return positions;
  }

  private LoadPositions(positions: RatedPosition[]) {
    for (let i = 0; i < positions.length; i++) {
      let position = positions[i];
      position.ball.x = position.x;
      position.ball.y = position.y;
    }
  }

  private Sort(center: Ball, unsorted: Ball[]) {
    unsorted.splice(unsorted.indexOf(center), 1);

    let connected = this.GetConnectedBalls(center);
    for (let i = 0; i < connected.length; i++) {
      if (!unsorted.includes(connected[i])) {
        continue;
      }

      let bestPosition = { x: 0, y: 0 };
      let bestScore = Number.MIN_SAFE_INTEGER;

      this.angles = shuffle(this.angles);

      for (let r = 0; r < 360; r++) {
        let angle = (this.angles[r] / 180) * Math.PI;

        let position = {
          x: center.x + Math.cos(angle) * this.distance,
          y: center.y + Math.sin(angle) * this.distance,
        };
        let score = this.RatePosition(position.x, position.y);

        if (score > bestScore) {
          bestScore = score;
          bestPosition = position;
        }

        if (score >= this.distance) {
          break;
        }
      }

      connected[i].x = bestPosition.x;
      connected[i].y = bestPosition.y;

      this.Sort(connected[i], unsorted);
    }
  }

  private RatePosition(x: number, y: number, ignore: Ball = null) {
    if (
      x < -this.screenSize.x / 2 + 55 * this.scale ||
      x >= this.screenSize.x / 2 - 55 * this.scale ||
      y < -this.screenSize.y / 2 + 20 * this.scale ||
      y >= this.screenSize.y / 2 - 50 * this.scale
    ) {
      return Number.MIN_VALUE;
    }

    let closestDistance = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < this.balls.length; i++) {
      let currentBall = this.balls[i];

      if (currentBall == ignore) {
        continue;
      }

      closestDistance = Math.min(
        closestDistance,
        this.Distance(x, y, currentBall.x, currentBall.y)
      );
    }

    return Math.min(closestDistance, this.distance);
  }

  private RateOverall(): number {
    let rating = 0;

    for (let i = 0; i < this.balls.length; i++) {
      rating += this.RatePosition(
        this.balls[i].x,
        this.balls[i].y,
        this.balls[i]
      );
    }

    for (let i = 0; i < this.connections.length; i++) {
      for (let j = i + 1; j < this.connections.length; j++) {
        if (this.Intersect(this.connections[i], this.connections[j])) {
          rating -= 2000;
        }
      }
    }

    return rating;
  }

  private ccw(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
  ) {
    return (y3 - y1) * (x2 - x1) > (y2 - y1) * (x3 - x1);
  }

  public Intersect(c1: Connection, c2: Connection): boolean {
    return (
      this.ccw(
        c1.start.x,
        c1.start.y,
        c2.start.x,
        c2.start.y,
        c2.end.x,
        c2.end.y
      ) !=
        this.ccw(
          c1.end.x,
          c1.end.y,
          c2.start.x,
          c2.start.y,
          c2.end.x,
          c2.end.y
        ) &&
      this.ccw(
        c1.start.x,
        c1.start.y,
        c1.end.x,
        c1.end.y,
        c2.start.x,
        c2.start.y
      ) !=
        this.ccw(c1.start.x, c1.start.y, c1.end.x, c1.end.y, c2.end.x, c2.end.y)
    );
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
    let exstantConnection = this.ConnectionExists(startZone, endZone);
    if (exstantConnection) {
      this.RemoveConnection(exstantConnection);
    }

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
      database.saveConnection(connection);
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
      database.saveConnection(connection);
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

  ConnectionExists(zone1: ZoneInfo, zone2: ZoneInfo): Connection {
    for (let i = 0; i < this.connections.length; i++) {
      let connection = this.connections[i];
      if (
        (connection.start.zone == zone1 && connection.end.zone == zone2) ||
        (connection.end.zone == zone1 && connection.start.zone == zone2)
      )
        return connection;
    }

    return null;
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

    let connections1 = this.GetConnections(b1);
    if (connections1.length == 0) {
      this.balls.splice(this.balls.indexOf(b2), 1);
    }

    let connections2 = this.GetConnections(b2);
    if (connections2.length == 0) {
      this.balls.splice(this.balls.indexOf(b2), 1);
    }

    database.deleteConnection(connection);
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

interface RatedPosition {
  ball: Ball;
  x: number;
  y: number;
}
